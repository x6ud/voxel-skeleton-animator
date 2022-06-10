import {mat4} from 'gl-matrix';
import {computed, defineComponent, onBeforeUnmount, onMounted, ref, Ref, watch} from 'vue';
import Class from '../common/type/Class';
import RenderLoop from '../common/utils/RenderLoop';
import AutoResizeCanvas from './components/AutoResizeCanvas/AutoResizeCanvas.vue';
import VerticalSplitter from './components/layout/VerticalSplitter/VerticalSplitter.vue';
import AnimationTimeline from './components/skeleton/AnimationTimeline/AnimationTimeline.vue';
import ModelTree from './components/skeleton/ModelTree/ModelTree.vue';
import NodeProperties from './components/skeleton/NodeProperties/NodeProperties.vue';
import PalettesPanel from './components/PalettesPanel/PalettesPanel.vue';
import PopupMenu from './components/popup/PopupMenu/PopupMenu.vue';
import PopupMenuItem from './components/popup/PopupMenu/PopupMenuItem.vue';
import SidePanel from './components/SidePanel/SidePanel.vue';
import {showOpenDialog, showPromptDialog, showSaveAsDialog} from './dialogs/dialogs';
import {skeletonModelComponentDefs} from './skeleton-engine/component-defs';
import {skeletonModelNodeDefs, skeletonModelValidRoots} from './skeleton-engine/node-defs';
import './skeleton-engine/nodes/side-effects';
import SkeletonAnimation from './skeleton-engine/SkeletonAnimation';
import SkeletonEngine, {NodeComponentValue} from './skeleton-engine/SkeletonEngine';
import SkeletonModel from './skeleton-engine/SkeletonModel';
import SkeletonModelNode from './skeleton-engine/SkeletonModelNode';
import SkeletonModelNodeComponent from './skeleton-engine/SkeletonModelNodeComponent';
import SkeletonModelNodeDef from './skeleton-engine/SkeletonModelNodeDef';
import {
    exportSkeletonProjectZip,
    getSkeletonModelNodePositionJson,
    loadSkeletonProjectZip,
    recoverSkeletonAnimationFromJson,
    recoverSkeletonModelNodeFromJson,
    recoverSkeletonModelNodePosition,
    skeletonAnimationToJson,
    skeletonModelNodeToJson
} from './skeleton-engine/store';
import {skeletonAnimatorTools, skeletonModelerTools} from './skeleton-engine/tools';
import Cursor from './skeleton-engine/tools/Cursor';
import {cloneJson} from './utils/clone';
import EditorHistory from './utils/EditorHistory';
import {saves} from './utils/saves';
import {createTransitionAnimation} from './utils/transition';

export default defineComponent({
    components: {
        AutoResizeCanvas,
        ModelTree,
        VerticalSplitter,
        SidePanel,
        PopupMenu,
        PopupMenuItem,
        NodeProperties,
        PalettesPanel,
        AnimationTimeline,
    },
    setup() {
        const engine = new SkeletonEngine();
        engine.onSetNodeValues = onSetNodeValues;
        engine.onSelectNode = onSelectNode;
        engine.onSelectAnimation = onSelectAnimation;

        const renderLoop = new RenderLoop(onUpdate);
        const history = new EditorHistory();

        const filename = ref<string | null>(null);
        const dirty = ref(false);
        history.onDirtyChange = function (b) {
            dirty.value = b;
        };

        const container = ref<HTMLElement>();
        const modelTreeWidth = ref(250);
        const propertiesPanelWidth = ref(234);
        const previewPanelHeight = ref(204);
        const animationPanelHeight = ref(266);
        const animationPanelMinimized = ref(false);
        const fps = ref(0);

        const mode = ref<'modeler' | 'animator'>('modeler');

        const model = ref<SkeletonModel>(engine.model) as Ref<SkeletonModel>;
        const animationModel = ref<SkeletonModel>(engine.animationModel) as Ref<SkeletonModel>;
        const selectedNodeId = ref(0);
        const selectedNode = ref<SkeletonModelNode | null>(null);

        const animations = ref<SkeletonAnimation[]>(engine.animations);
        engine.animations = animations.value; // replace with vue proxy object
        const currentAnimationId = ref(0);
        const currentAnimation = ref<SkeletonAnimation | null>(null);
        const time = ref(0); // current animation keyframe

        const tools = computed(function () {
            return mode.value === 'modeler' ? skeletonModelerTools : skeletonAnimatorTools;
        });
        const tool = ref(engine.tool); // current tool name
        const color1 = ref(0xffffff);
        const color2 = ref(0x000000);
        const mouseRightAsEraser = ref(true);
        const showPalettes = ref(false);
        const previewMask = ref(false);

        // apply data change after input vue component updating
        let unpostedNodeValueInput: (() => void) | null = null;
        const clipboardKeyframeRecords: { nodeId: number, component: string, value: any }[] = [];

        const validChildDefs = computed<SkeletonModelNodeDef[]>(function () {
            if (selectedNodeId.value) {
                const selectedNode = engine.getNode(selectedNodeId.value);
                return skeletonModelNodeDefs[selectedNode.type].validChildTypes.map(name => skeletonModelNodeDefs[name]);
            }
            return skeletonModelValidRoots;
        });

        function switchMode() {
            engine.mode = mode.value;
            switch (mode.value) {
                case 'modeler': {
                    model.value = engine.model;
                    engine.model = model.value; // replace with vue proxy object
                }
                    break;
                case 'animator': {
                    animationModel.value = engine.animationModel;
                    engine.animationModel = animationModel.value; // replace with vue proxy object
                    engine.prepareAnimationModel();
                }
                    break;
            }
            selectedNode.value = selectedNodeId.value ? engine.getNode(selectedNodeId.value, engine.activeModel) : null;
            updateAnimationModel();
        }

        function updateAnimationModel() {
            if (engine.mode === 'animator' && engine.currentAnimationId) {
                engine.animationModelNeedsUpdate = true;
                engine.time = time.value;
            }
        }

        watch(mode,
            function (mode) {
                switchMode();
                const tools = mode === 'modeler' ? skeletonModelerTools : skeletonAnimatorTools;
                if (!tools[tool.value]) {
                    onSelectTool(Cursor.name);
                }
            },
            {immediate: true}
        );

        watch(selectedNodeId, function (nodeId) {
            selectedNode.value = nodeId ? engine.getNode(nodeId, engine.activeModel) : null;
        });

        // reset animation model when selected animation change
        watch(currentAnimationId, function (animationId) {
            engine.currentAnimationId = animationId;
            currentAnimation.value = animationId ? engine.getAnimation(animationId) : null;
            if (engine.mode === 'animator') {
                engine.prepareAnimationModel();
                updateAnimationModel();
            }
        });

        watch(time, function () {
            updateAnimationModel();
        });

        // update page title as filename
        watch([filename, dirty],
            function ([filename, dirty]) {
                document.title = (filename || 'Untitled') + (dirty ? '*' : '');
            },
            {immediate: true}
        );

        // ======================== methods ========================

        onMounted(function () {
            history.setup();
            renderLoop.start();
        });

        onBeforeUnmount(function () {
            history.unload();
            renderLoop.stop();
        });

        function onCanvasMounted(dom: HTMLCanvasElement) {
            engine.bind(dom);
        }

        function onCanvasUnmounted() {
            engine.unbind();
        }

        function onPreviewCanvasMounted(dom: HTMLCanvasElement) {
            engine.bindPreview(dom);
        }

        function onPreviewCanvasUnmounted() {
            engine.unbindPreview();
        }

        function focus() {
            container.value?.focus();
        }

        function reset() {
            clipboardKeyframeRecords.length = 0;
            selectedNodeId.value = engine.selectedNodeId;
            currentAnimationId.value = engine.currentAnimationId;
            switchMode();
            unpostedNodeValueInput = null;
            history.clear();
        }

        async function onCreateNew() {
            if (await history.confirm()) {
                engine.model = new SkeletonModel();
                engine.animations.length = 0;
                engine.selectedNodeId = 0;
                engine.currentAnimationId = 0;
                filename.value = null;
                reset();
                focus();
            }
        }

        async function onOpen() {
            const openFilename = await showOpenDialog('/models');
            if (openFilename) {
                if (await history.confirm()) {
                    const buffer = await saves.read('/models/' + openFilename + '.zip');
                    await loadSkeletonProjectZip(buffer, engine);
                    color1.value = engine.color1;
                    color2.value = engine.color2;
                    mouseRightAsEraser.value = engine.mouseRightAsEraser;
                    filename.value = openFilename;
                    reset();
                }
            }
            focus();
        }

        async function onSave() {
            if (filename.value) {
                await saveFile(filename.value);
            } else {
                await onSaveAs();
            }
            focus();
        }

        async function onSaveAs() {
            const newFilename = await showSaveAsDialog('/models', filename.value);
            if (newFilename) {
                await saveFile(newFilename);
                filename.value = newFilename;
            }
            focus();
        }

        async function saveFile(filename: string) {
            await saves.write('/models/' + filename + '.zip', await exportSkeletonProjectZip(engine));
            history.saved();
        }

        function onUndo(e?: KeyboardEvent) {
            if ((e?.target as HTMLElement).tagName === 'INPUT') {
                return;
            }
            e?.preventDefault();
            history.undo();
            focus();
        }

        function onRedo(e?: KeyboardEvent) {
            if ((e?.target as HTMLElement).tagName === 'INPUT') {
                return;
            }
            e?.preventDefault();
            history.redo();
            focus();
        }

        function onUpdate(dt: number) {
            fps.value = Math.floor(1 / dt);
            engine.color1 = color1.value;
            engine.color2 = color2.value;
            engine.mouseRightAsEraser = mouseRightAsEraser.value;
            engine.update();
            color1.value = engine.color1;
            color2.value = engine.color2;
            mouseRightAsEraser.value = engine.mouseRightAsEraser;
        }

        function onSetCameraRotation(rotateX: number, rotateY: number) {
            const camera = engine.camera;
            const rx0 = camera.rotateXDeg;
            const ry0 = camera.rotateYDeg;
            const dx = rotateX - rx0;
            const dy = rotateY - ry0;
            createTransitionAnimation(
                function (t) {
                    camera.rotateXDeg = t * dx + rx0;
                    camera.rotateYDeg = t * dy + ry0;
                }
            );
        }

        function onSetPreviewModelRotation(e: InputEvent) {
            mat4.fromYRotation(engine.previewTransform, Number(-(e.target as HTMLInputElement).value) / 8 * Math.PI * 2);
        }

        function onTogglePreviewMask() {
            previewMask.value = !previewMask.value;
            engine.previewMask = previewMask.value;
        }

        function onSelectTool(name: string) {
            tool.value = name;
            engine.tool = name;
        }

        function onSelectNode(nodeId: number) {
            if (unpostedNodeValueInput) {
                unpostedNodeValueInput();
            }
            selectedNodeId.value = nodeId;
            engine.selectedNodeId = nodeId;
        }

        function onSetData<T>(node: SkeletonModelNode, component: Class<SkeletonModelNodeComponent<T>>, value: T) {
            unpostedNodeValueInput = null;
            onSetNodeValues([{node, component, value}]);
        }

        function onWaitForNodeValueInputPost<T>(node: SkeletonModelNode, component: Class<SkeletonModelNodeComponent<T>>, value: T) {
            unpostedNodeValueInput = function () {
                onSetData(node, component, value);
            };
        }

        function onSetNodeValues(values: NodeComponentValue<any>[]) {
            switch (mode.value) {
                case 'modeler': {
                    type Record<T> = { id: number, component: Class<SkeletonModelNodeComponent<T>>, value: T };
                    let oldValues: Record<any>[] = values.map(item => ({
                        id: item.node.id,
                        component: item.component,
                        value: item.node.getValue(item.component),
                    }));
                    const newValues: Record<any>[] = values.map(item => ({
                        id: item.node.id,
                        component: item.component,
                        value: item.value,
                    }));
                    let recordName = 'Set';
                    for (let item of values) {
                        recordName += ` #${item.node.id} ${item.component.name}`;
                    }
                    history.applyAndRecord(
                        function (undoCtx) {
                            if (undoCtx != null) {
                                oldValues = undoCtx as Record<any>[];
                            }
                        },
                        function () {
                            for (let item of newValues) {
                                const node = engine.getNode(item.id);
                                engine.setData(node, item.component, item.value);
                            }
                        },
                        function () {
                            for (let item of oldValues) {
                                const node = engine.getNode(item.id);
                                engine.setData(node, item.component, item.value);
                            }
                            return oldValues;
                        },
                        null,
                        recordName,
                        true,
                    );
                }
                    break;
                case 'animator': {
                    type Record = { id: number, component: string, value: any };
                    const animationId = currentAnimationId.value;
                    if (!animationId) {
                        return;
                    }
                    const t = time.value;
                    const animation = engine.getAnimation(animationId);
                    let oldValues: Record[] = [];
                    for (let item of values) {
                        const keyframe = engine.findKeyframe(animation, t, item.node.id, item.component.name);
                        if (keyframe) {
                            oldValues.push({
                                id: item.node.id,
                                component: item.component.name,
                                value: item.value
                            });
                        } else {
                            oldValues.push({
                                id: item.node.id,
                                component: item.component.name,
                                value: null
                            });
                        }
                    }
                    const newValues: Record[] = values.map(item => ({
                        id: item.node.id,
                        component: item.component.name,
                        value: item.value,
                    }));
                    let recordName = `Set Animation #${animationId} Keyframe`;
                    for (let item of values) {
                        recordName += `:${t} #${item.node.id} ${item.component.name}`;
                    }
                    history.applyAndRecord(
                        function (undoCtx) {
                            if (undoCtx != null) {
                                oldValues = undoCtx as Record[];
                            }
                        },
                        function () {
                            const animation = engine.getAnimation(animationId);
                            for (let item of newValues) {
                                engine.setKeyframe(animation, t, item.id, item.component, item.value);
                            }
                            updateAnimationModel();
                        },
                        function (merging) {
                            if (!merging) {
                                const animation = engine.getAnimation(animationId);
                                for (let item of oldValues) {
                                    if (item.value != null) {
                                        engine.setKeyframe(animation, t, item.id, item.component, item.value);
                                    } else {
                                        engine.removeKeyframe(animation, t, item.id, item.component);
                                    }
                                }
                                engine.prepareAnimationModel();
                                updateAnimationModel();
                            }
                            return oldValues;
                        },
                        null,
                        recordName,
                        true,
                    );
                }
                    break;
            }
        }

        function onAddNode(nodeDef: SkeletonModelNodeDef) {
            const parent = engine.selectedNode;
            const node = engine.createNode(nodeDef, parent);
            const json = skeletonModelNodeToJson(engine, node);
            history.record(
                null,
                function () {
                    recoverSkeletonModelNodeFromJson(engine, json);
                },
                function () {
                    engine.removeNode(engine.getNode(json.id));
                    focus();
                },
                null,
                `Add node ${nodeDef.name} parent #${parent?.id}`,
                false,
            );
        }

        function onCloneNode(targetId: number, mirror: boolean) {
            let nodeId: number = 0;
            history.applyAndRecord(
                null,
                function () {
                    nodeId = engine.clone(engine.getNode(targetId), mirror).id;
                },
                function () {
                    engine.removeNode(engine.getNode(nodeId));
                    focus();
                },
                null,
                `Clone Node #${targetId}`,
                false
            );
        }

        function onRemoveNode(nodeId: number) {
            const node = engine.getNode(nodeId);
            const json = skeletonModelNodeToJson(engine, node);
            history.applyAndRecord(
                null,
                function () {
                    engine.removeNode(engine.getNode(nodeId));
                    focus();
                },
                function () {
                    const node = recoverSkeletonModelNodeFromJson(engine, json);
                    onSelectNode(node.id);
                },
                null,
                `Remove node #${nodeId}`,
                false,
            );
        }

        function onMoveNode(target: SkeletonModelNode, related: SkeletonModelNode, position: 'before' | 'inside' | 'after') {
            const targetId = target.id;
            const relatedId = related.id;
            const json = getSkeletonModelNodePositionJson(engine, target);
            history.applyAndRecord(
                null,
                function () {
                    engine.moveNode(
                        engine.getNode(targetId),
                        engine.getNode(relatedId),
                        position,
                    );
                },
                function () {
                    recoverSkeletonModelNodePosition(engine, json);
                },
                null,
                `Move node #${targetId} ${position} #${relatedId}`,
                false,
            );
        }

        function onSelectAnimation(animationId: number) {
            currentAnimationId.value = animationId;
        }

        function onAddAnimation() {
            const animation = engine.createAnimation();
            onSelectAnimation(animation.id);
            const json = skeletonAnimationToJson(animation);
            history.record(
                null,
                function () {
                    const animation = recoverSkeletonAnimationFromJson(engine, json);
                    onSelectAnimation(animation.id);
                },
                function () {
                    engine.removeAnimation(engine.getAnimation(animation.id));
                    focus();
                },
                null,
                `Add animation`,
                false
            );
        }

        function onCloneAnimation() {
            const animationId = currentAnimationId.value;
            let newAnimationId = 0;
            history.applyAndRecord(
                null,
                function () {
                    const animation = engine.cloneAnimation(engine.getAnimation(animationId));
                    newAnimationId = animation.id;
                    onSelectAnimation(animation.id);
                },
                function () {
                    engine.removeAnimation(engine.getAnimation(newAnimationId));
                    focus();
                },
                null,
                `Clone animation #${animationId}`,
                false
            );
        }

        function onRemoveAnimation() {
            const animation = engine.getAnimation(currentAnimationId.value);
            const json = skeletonAnimationToJson(animation);
            history.applyAndRecord(
                null,
                function () {
                    engine.removeAnimation(engine.getAnimation(json.id));
                    focus();
                },
                function () {
                    const animation = recoverSkeletonAnimationFromJson(engine, json);
                    onSelectAnimation(animation.id);
                },
                null,
                `Remove animation #${animation.id}`,
                false
            )
        }

        async function onRenameAnimation() {
            const animationId = currentAnimationId.value;
            const animation = engine.getAnimation(animationId);
            const oldName = animation.name;
            const name = await showPromptDialog('Rename', animation.name);
            focus();
            if (name == null) {
                return;
            }
            history.applyAndRecord(
                null,
                function () {
                    engine.getAnimation(animationId).name = name;
                },
                function () {
                    engine.getAnimation(animationId).name = oldName;
                },
                null,
                `Rename animation #${animationId}`,
                false
            );
        }

        function onRemoveKeyframe(animation: SkeletonAnimation, time: number, nodeId: number | null, component?: string) {
            let records: { time: number, nodeId: number, component: string, value: any }[] = [];
            for (let keyframe of animation.keyframes) {
                if (keyframe.time === time
                    && (nodeId == null || keyframe.nodeId === nodeId)
                    && (!component || component === keyframe.component)
                ) {
                    records.push({
                        time,
                        nodeId: keyframe.nodeId,
                        component: keyframe.component,
                        value: keyframe.value,
                    });
                }
            }
            if (!records.length) {
                return;
            }
            const animationId = animation.id;
            history.applyAndRecord(
                null,
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        engine.removeKeyframe(animation, record.time, record.nodeId, record.component);
                    }
                    engine.prepareAnimationModel();
                    updateAnimationModel();
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        engine.setKeyframe(animation, record.time, record.nodeId, record.component, record.value);
                    }
                    updateAnimationModel();
                },
                null,
                `Remove keyframe #${animationId}:${time} #${nodeId} #${component || ''}`,
                false
            );
        }

        function onMoveKeyframe(animation: SkeletonAnimation, time: number, nodeId: number | null, component: string | undefined, newTime: number) {
            let records: {
                time: number,
                nodeId: number,
                component: string,
                value: any,
                newTime: number,
                oldValue: any,
            }[] = [];
            const animationId = animation.id;
            history.applyAndRecord(
                function (prevCtx) {
                    const animation = engine.getAnimation(animationId);
                    if (prevCtx != null) {
                        records = prevCtx as any;
                        for (let record of records) {
                            record.newTime = newTime;
                            record.oldValue = null;
                        }
                    } else {
                        for (let keyframe of animation.keyframes) {
                            if (
                                keyframe.time === time
                                && (nodeId == null || keyframe.nodeId === nodeId)
                                && (!component || component === keyframe.component)
                            ) {
                                records.push({
                                    time: keyframe.time,
                                    nodeId: keyframe.nodeId,
                                    component: keyframe.component,
                                    value: keyframe.value,
                                    newTime,
                                    oldValue: null,
                                });
                            }
                        }
                    }
                    for (let record of records) {
                        for (let keyframe of animation.keyframes) {
                            if (
                                keyframe.time === newTime
                                && keyframe.nodeId === record.nodeId
                                && keyframe.component === record.component
                            ) {
                                record.oldValue = keyframe.value;
                            }
                        }
                    }
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        engine.removeKeyframe(animation, record.time, record.nodeId, record.component);
                        engine.setKeyframe(animation, record.newTime, record.nodeId, record.component, record.value);
                    }
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        if (record.oldValue != null) {
                            engine.setKeyframe(animation, record.newTime, record.nodeId, record.component, record.oldValue);
                        } else {
                            engine.removeKeyframe(animation, record.newTime, record.nodeId, record.component);
                        }
                        engine.setKeyframe(animation, record.time, record.nodeId, record.component, record.value);
                    }
                    return records;
                },
                function () {
                    updateAnimationModel();
                },
                `Move keyframe #${animation.id}:${time} #${nodeId || ''} #${component || ''}`,
                true,
            );
        }

        function onSetKeyframe(animation: SkeletonAnimation, time: number) {
            type Record = { nodeId: number, component: string, value: any };
            const records: Map<string, Record> = new Map();
            engine.animationModel.forEach(node => {
                for (let type in node.components) {
                    const componentInfo = skeletonModelComponentDefs[type];
                    if (componentInfo.interpFunc) {
                        records.set(`${node.id}#${type}`, {
                            nodeId: node.id,
                            component: type,
                            value: cloneJson(node.components[type].value)
                        });
                    }
                }
            });
            for (let keyframe of animation.keyframes) {
                if (keyframe.time === time && records.has(keyframe.hash)) {
                    records.delete(keyframe.hash);
                }
            }
            if (!records.size) {
                return;
            }
            const animationId = animation.id;
            history.applyAndRecord(
                null,
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records.values()) {
                        engine.setKeyframe(animation, time, record.nodeId, record.component, cloneJson(record.value));
                    }
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records.values()) {
                        engine.removeKeyframe(animation, time, record.nodeId, record.component);
                    }
                },
                null,
                `Set keyframe #${animationId}:${time}`,
                false,
            );
        }

        function onTimelineMoveLeft(animation: SkeletonAnimation, t: number) {
            type Record = { time: number, nodeId: number, component: string, value: any };
            const records: Record[] = [];
            for (let keyframe of animation.keyframes) {
                if (keyframe.time === t - 1) {
                    records.push({
                        time: keyframe.time,
                        nodeId: keyframe.nodeId,
                        component: keyframe.component,
                        value: keyframe.value
                    });
                }
            }
            const animationId = animation.id;
            history.applyAndRecord(
                null,
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        engine.removeKeyframe(animation, record.time, record.nodeId, record.component);
                    }
                    for (let keyframe of animation.keyframes) {
                        if (keyframe.time >= t) {
                            keyframe.time -= 1;
                        }
                    }
                    time.value = t - 1;
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let keyframe of animation.keyframes) {
                        if (keyframe.time >= t - 1) {
                            keyframe.time += 1;
                        }
                    }
                    for (let record of records) {
                        engine.setKeyframe(animation, record.time, record.nodeId, record.component, record.value);
                    }
                    time.value = t;
                },
                function () {
                    updateAnimationModel();
                },
                `Move left #${animationId}:${t}`,
                false,
            );
        }

        function onTimelineMoveRight(animation: SkeletonAnimation, t: number) {
            const animationId = animation.id;
            history.applyAndRecord(
                null,
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let keyframe of animation.keyframes) {
                        if (keyframe.time >= t) {
                            keyframe.time += 1;
                        }
                    }
                    time.value = t + 1;
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let keyframe of animation.keyframes) {
                        if (keyframe.time >= t + 1) {
                            keyframe.time -= 1;
                        }
                    }
                    time.value = t;
                },
                function () {
                    updateAnimationModel();
                },
                `Move right #${animationId}:${t}`,
                false,
            );
        }

        function onCopyKeyframe(animation: SkeletonAnimation, t: number, nodeId?: number, component?: string) {
            clipboardKeyframeRecords.length = 0;
            for (let keyframe of animation.keyframes) {
                if (keyframe.time !== t) {
                    continue;
                }
                if (nodeId && nodeId !== keyframe.nodeId) {
                    continue;
                }
                if (nodeId && component && component !== keyframe.component) {
                    continue;
                }
                clipboardKeyframeRecords.push({
                    nodeId: keyframe.nodeId,
                    component: keyframe.component,
                    value: cloneJson(keyframe.value),
                });
            }
        }

        function onPasteKeyframe(animation: SkeletonAnimation, t: number) {
            if (!clipboardKeyframeRecords.length) {
                return;
            }
            type Record = { nodeId: number, component: string, oldValue: any, newValue: any };
            const records: Record[] = [];
            for (let record of clipboardKeyframeRecords) {
                records.push({
                    nodeId: record.nodeId,
                    component: record.component,
                    oldValue: null,
                    newValue: record.value,
                });
            }
            for (let record of records) {
                for (let keyframe of animation.keyframes) {
                    if (
                        keyframe.time === t
                        && keyframe.nodeId === record.nodeId
                        && keyframe.component === record.component
                    ) {
                        record.oldValue = cloneJson(keyframe.value);
                    }
                }
            }
            const animationId = animation.id;
            history.applyAndRecord(
                null,
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        engine.setKeyframe(animation, t, record.nodeId, record.component, record.newValue);
                    }
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        if (record.oldValue == null) {
                            engine.removeKeyframe(animation, t, record.nodeId, record.component);
                        } else {
                            engine.setKeyframe(animation, t, record.nodeId, record.component, record.oldValue);
                        }
                    }
                },
                function () {
                    updateAnimationModel();
                },
                `Paste keyframe to #${animation.id}:${t}`,
                false
            );
        }

        function onFlipKeyframe(animation: SkeletonAnimation, t: number) {
            type Record = { nodeId: number, component: string, oldValue: any, newValue: any };
            const records: Record[] = [];
            for (let keyframe of animation.keyframes) {
                if (keyframe.time === t) {
                    const componentDef = skeletonModelComponentDefs[keyframe.component];
                    if (componentDef.flipFunc) {
                        const mirrorNode = engine.model.getMirrorNode(keyframe.nodeId);
                        if (mirrorNode) {
                            const mirrorNodeKeyframe = animation.keyframes.find(
                                curr => curr.nodeId === mirrorNode.id
                                    && curr.time === t
                                    && curr.component === keyframe.component
                            );
                            if (mirrorNodeKeyframe) {
                                records.push({
                                    nodeId: keyframe.nodeId,
                                    component: keyframe.component,
                                    oldValue: cloneJson(keyframe.value),
                                    newValue: componentDef.flipFunc(mirrorNodeKeyframe.value, mirrorNode),
                                });
                            }
                        } else {
                            records.push({
                                nodeId: keyframe.nodeId,
                                component: keyframe.component,
                                oldValue: cloneJson(keyframe.value),
                                newValue: componentDef.flipFunc(keyframe.value, engine.getNode(keyframe.nodeId)),
                            });
                        }
                    }
                }
            }
            if (!records.length) {
                return;
            }
            const animationId = animation.id;
            history.applyAndRecord(
                null,
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        engine.setKeyframe(animation, t, record.nodeId, record.component, record.newValue);
                    }
                },
                function () {
                    const animation = engine.getAnimation(animationId);
                    for (let record of records) {
                        engine.setKeyframe(animation, t, record.nodeId, record.component, record.oldValue);
                    }
                },
                function () {
                    updateAnimationModel();
                },
                `Flip keyframe #${animation.id}:${t}`,
                false
            );
        }

        return {
            tools,
            engine,

            container,
            modelTreeWidth,
            propertiesPanelWidth,
            previewPanelHeight,
            animationPanelHeight,
            animationPanelMinimized,
            fps,

            mode,

            model,
            animationModel,
            selectedNodeId,
            selectedNode,

            animations,
            currentAnimationId,
            currentAnimation,
            time,

            tool,
            color1,
            color2,
            mouseRightAsEraser,
            showPalettes,
            previewMask,

            validChildDefs,

            onCanvasMounted,
            onCanvasUnmounted,
            onPreviewCanvasMounted,
            onPreviewCanvasUnmounted,

            onCreateNew,
            onOpen,
            onSave,
            onSaveAs,
            onUndo,
            onRedo,

            onSetCameraRotation,
            onSetPreviewModelRotation,
            onTogglePreviewMask,
            onSelectTool,

            onSelectNode,
            onSetData,
            onWaitForNodeValueInputPost,
            onAddNode,
            onCloneNode,
            onRemoveNode,
            onMoveNode,

            onAddAnimation,
            onCloneAnimation,
            onRemoveAnimation,
            onRenameAnimation,
            onRemoveKeyframe,
            onMoveKeyframe,
            onSetKeyframe,
            onTimelineMoveLeft,
            onTimelineMoveRight,
            onCopyKeyframe,
            onPasteKeyframe,
            onFlipKeyframe,
        };
    }
});
