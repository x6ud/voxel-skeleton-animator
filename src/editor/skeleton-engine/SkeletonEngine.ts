import {mat4, ReadonlyMat4, vec3} from 'gl-matrix';
import FrameBuffer from '../../common/render/FrameBuffer';
import Renderer from '../../common/render/Renderer';
import Shader from '../../common/render/Shader';
import Texture from '../../common/render/Texture';
import Class from '../../common/type/Class';
import WrappedCamera from '../utils/camera/WrappedCamera';
import {cloneJson} from '../utils/clone';
import Input from '../utils/Input';
import UpdateSystem from '../utils/UpdateSystem';
import {skeletonModelComponentDefs} from './component-defs';
import MirrorNodeId from './components/MirrorNodeId';
import Name from './components/Name';
import {skeletonModelNodeDefs} from './node-defs';
import directionalLightFrag from './shaders/directional-light.frag';
import directionalLightVert from './shaders/directional-light.vert';
import fastFrag from './shaders/fast.frag';
import fastVert from './shaders/fast.vert';
import fillFrag from './shaders/fill.frag';
import fillVert from './shaders/fill.vert';
import lineFrag from './shaders/line.frag';
import lineVert from './shaders/line.vert';
import outlineFrag from './shaders/outline.frag';
import outlineVert from './shaders/outline.vert';
import picking2dFrag from './shaders/picking-2d.frag';
import picking2dVert from './shaders/picking-2d.vert';
import pickingMeshFrag from './shaders/picking-mesh.frag';
import pickingMeshVert from './shaders/picking-mesh.vert';
import pickingFrag from './shaders/picking.frag';
import pickingVert from './shaders/picking.vert';
import plainFrag from './shaders/plain.frag';
import plainVert from './shaders/plain.vert';
import shadowMappingFrag from './shaders/shadow-mapping.frag';
import shadowMappingVert from './shaders/shadow-mapping.vert';
import SkeletonAnimation from './SkeletonAnimation';
import SkeletonAnimationKeyframe from './SkeletonAnimationKeyframe';
import SkeletonModel from './SkeletonModel';
import SkeletonModelNode from './SkeletonModelNode';
import SkeletonModelNodeChangeWatcher from './SkeletonModelNodeChangeWatcher';
import SkeletonModelNodeComponent from './SkeletonModelNodeComponent';
import SkeletonModelNodeDef from './SkeletonModelNodeDef';
import {SkeletonObjectType} from './SkeletonObjectType';
import CameraDraggingSystem from './systems/CameraDraggingSystem';
import GridRenderSystem from './systems/GridRenderSystem';
import MeshRenderSystem from './systems/MeshRenderSystem';
import MouseMappingSystem from './systems/MouseSystem';
import NodesRenderSystem from './systems/NodesRenderSystem';
import NodesUpdateSystem from './systems/NodesUpdateSystem';
import PickingRenderSystem from './systems/PickingRenderSystem';
import PickingSystem from './systems/PickingSystem';
import PreviewCameraDraggingSystem from './systems/PreviewCameraDraggingSystem';
import PreviewRenderSystem from './systems/PreviewRenderSystem';
import BoundingBoxEdgeRenderFilter from './systems/render-filters/BoundingBoxEdgeRenderFilter';
import BoundingBoxPickingRenderFilter from './systems/render-filters/BoundingBoxPickingRenderFilter';
import IkChainPickingRenderFilter from './systems/render-filters/IkChainPickingRenderFilter';
import IkChainRenderFilter from './systems/render-filters/IkChainRenderFilter';
import PreviewLightRenderFilter from './systems/render-filters/PreviewLightRenderFilter';
import PreviewVoxelRenderFilter from './systems/render-filters/PreviewVoxelRenderFilter';
import VoxelEdgeRenderFilter from './systems/render-filters/VoxelEdgeRenderFilter';
import VoxelFaceRenderFilter from './systems/render-filters/VoxelFaceRenderFilter';
import VoxelPickingRenderFilter from './systems/render-filters/VoxelPickingRenderFilter';
import RenderSystem from './systems/RenderSystem';
import ToolPickingRenderSystem from './systems/ToolPickingRenderSystem';
import ToolPostSolveSystem from './systems/ToolPostSolveSystem';
import ToolPreSolveSystem from './systems/ToolPreSolveSystem';
import ToolRenderSystem from './systems/ToolRenderSystem';
import BoundingBoxUpdateFilter from './systems/update-filters/BoundingBoxUpdateFilter';
import IkChainUpdateFilter from './systems/update-filters/IkChainUpdateFilter';
import TransformUpdateFilter from './systems/update-filters/TransformUpdateFilter';
import VoxelUpdateFilter from './systems/update-filters/VoxelUpdateFilter';
import Cursor from './tools/Cursor';
import BoundingBoxChangeWatcher from './watchers/BoundingBoxChangeWatcher';
import IkChainChangeWatcher from './watchers/IkChainChangeWatcher';
import TransformChangeWatcher from './watchers/TransformChangeWatcher';
import VoxelChangeWatcher from './watchers/VoxelChangeWatcher';

export type NodeComponentValue<T> = { node: SkeletonModelNode, component: Class<SkeletonModelNodeComponent<T>>, value: T };

export default class SkeletonEngine {

    // ======================== systems ========================
    readonly nodeChangeWatchers: SkeletonModelNodeChangeWatcher[] = [
        new TransformChangeWatcher(),
        new BoundingBoxChangeWatcher(),
        new VoxelChangeWatcher(),
        new IkChainChangeWatcher(),
    ];
    readonly updateSystems: UpdateSystem<SkeletonEngine>[] = [
        // ======================== editor ========================
        new NodesUpdateSystem(
            new TransformUpdateFilter().sub(
                new IkChainUpdateFilter()
            ),
            new BoundingBoxUpdateFilter(),
            new VoxelUpdateFilter(),
        ),
        new RenderSystem().sub(
            new MouseMappingSystem(),
            new ToolPreSolveSystem(),
            new MeshRenderSystem().sub(
                new GridRenderSystem(),
                new NodesRenderSystem(
                    new VoxelFaceRenderFilter(),
                    new VoxelEdgeRenderFilter(),
                    new BoundingBoxEdgeRenderFilter(),
                    new IkChainRenderFilter(),
                ),
                new ToolRenderSystem(),
            ),
            new PickingRenderSystem().sub(
                new NodesRenderSystem(
                    new VoxelPickingRenderFilter(),
                    new BoundingBoxPickingRenderFilter(),
                    new IkChainPickingRenderFilter(),
                ),
                new ToolPickingRenderSystem(),
            ),
        ),
        new PickingSystem(),
        new ToolPostSolveSystem(),
        new CameraDraggingSystem(),
        // ======================== preview ========================
        new PreviewRenderSystem().sub(
            new NodesRenderSystem(
                new PreviewLightRenderFilter(),
                new PreviewVoxelRenderFilter(),
            )
        ),
        new PreviewCameraDraggingSystem(),
    ];

    // ======================== binding ========================
    canvas?: HTMLCanvasElement;
    ctx2d?: CanvasRenderingContext2D;
    previewCanvas?: HTMLCanvasElement;
    previewCtx2d?: CanvasRenderingContext2D;

    // ======================== render ========================
    readonly renderer: Renderer;
    readonly lineShader: Shader;
    readonly plainShader: Shader;
    readonly directionalLightShader: Shader;
    readonly fastShader: Shader;
    readonly shadowMappingShader: Shader;
    readonly pickingShader: Shader;
    readonly pickingMeshShader: Shader;
    readonly picking2dShader: Shader;
    readonly outlineShader: Shader;
    readonly fillShader: Shader;

    readonly meshFrameBuffer: FrameBuffer;
    readonly colorTexture: Texture;
    readonly depthTexture: Texture;

    readonly pickingFrameBuffer: FrameBuffer;
    readonly objectTypeFrameBuffer: FrameBuffer;
    readonly objectIdFrameBuffer: FrameBuffer;
    readonly objectTypeTexture: Texture;
    readonly objectIdTexture: Texture;
    readonly pickingDepthTexture: Texture;

    // ======================== project ========================
    model: SkeletonModel = new SkeletonModel();
    animations: SkeletonAnimation[] = [];

    // ======================== components ========================
    readonly input: Input = new Input();
    readonly camera = new WrappedCamera();
    readonly previewInput: Input = new Input();
    readonly previewCamera = new WrappedCamera();
    readonly previewTransform: mat4 = mat4.identity(mat4.create());

    // ======================== callbacks ========================
    onSelectNode: (nodeId: number) => void = () => {
    };
    onSelectAnimation: (animationId: number) => void = () => {
    };
    onSetNodeValues: (values: NodeComponentValue<any>[]) => void = () => {
    };

    // ======================== internal ========================
    mode: 'modeler' | 'animator' = 'modeler';
    tool: string = Cursor.name;

    color1: number = 0xffffff;
    color2: number = 0x000000;
    mouseRightAsEraser: boolean = true;

    readonly mouseNormalized = vec3.create();
    readonly mouseRay0 = vec3.create();
    readonly mouseRay1 = vec3.create();
    readonly mouseNormal = vec3.create();

    selectedNodeId: number = 0;
    private _selectedNode: SkeletonModelNode | null = null;

    hoveredObjectType: SkeletonObjectType = SkeletonObjectType.NONE;
    hoveredObjectId: number = 0;
    draggingObjectType: SkeletonObjectType = SkeletonObjectType.NONE;
    draggingObjectId: number = 0;
    draggingWithMouseRight = false;

    texPreviewLightDepth?: Texture;
    matPreviewLight?: ReadonlyMat4;
    readonly previewCameraZoom: number = 2;
    previewMask: boolean = false;

    animationModel: SkeletonModel = new SkeletonModel();
    currentAnimationId: number = 0;
    time: number = 0;
    animationModelNeedsUpdate: boolean = true;
    private _currentAnimation: SkeletonAnimation | null = null;

    constructor(renderer?: Renderer) {
        this.renderer = renderer || new Renderer(undefined, 100);

        this.lineShader = this.renderer.createShader(lineVert, lineFrag);
        this.plainShader = this.renderer.createShader(plainVert, plainFrag);
        this.directionalLightShader = this.renderer.createShader(directionalLightVert, directionalLightFrag);
        this.fastShader = this.renderer.createShader(fastVert, fastFrag);
        this.shadowMappingShader = this.renderer.createShader(shadowMappingVert, shadowMappingFrag);
        this.pickingShader = this.renderer.createShader(pickingVert, pickingFrag);
        this.pickingMeshShader = this.renderer.createShader(pickingMeshVert, pickingMeshFrag);
        this.picking2dShader = this.renderer.createShader(picking2dVert, picking2dFrag);
        this.outlineShader = this.renderer.createShader(outlineVert, outlineFrag);
        this.fillShader = this.renderer.createShader(fillVert, fillFrag);

        this.meshFrameBuffer = this.renderer.createFrameBuffer();
        this.colorTexture = this.renderer.createEmptyTexture(0, 0, true);
        this.depthTexture = this.renderer.createDepthTexture();

        this.pickingFrameBuffer = this.renderer.createFrameBuffer();
        this.objectTypeFrameBuffer = this.renderer.createFrameBuffer();
        this.objectIdFrameBuffer = this.renderer.createFrameBuffer();
        this.objectTypeTexture = this.renderer.createEmptyTexture();
        this.objectIdTexture = this.renderer.createEmptyTexture();
        this.pickingDepthTexture = this.renderer.createDepthTexture();

        this.renderer.attachColorTextures(this.meshFrameBuffer, [this.colorTexture]);
        this.renderer.attachDepthTexture(this.meshFrameBuffer, this.depthTexture);
        this.renderer.attachColorTextures(this.pickingFrameBuffer, [this.objectTypeTexture, this.objectIdTexture]);
        this.renderer.attachDepthTexture(this.pickingFrameBuffer, this.pickingDepthTexture);
        this.renderer.attachColorTexture(this.objectTypeFrameBuffer, this.objectTypeTexture);
        this.renderer.attachColorTexture(this.objectIdFrameBuffer, this.objectIdTexture);

        this.previewCamera.zoomInStep = 0.5;
        this.previewCamera.zoomOutStep = 2.0;
        this.previewCamera.zoom = 0;
        this.previewCamera.far = 1000;
        this.previewCamera.orthographicZoomRatio = 25 / this.previewCameraZoom * this.previewCameraZoom;
    }

    // ======================== binding ========================
    bind(canvas: HTMLCanvasElement) {
        const ctx2d = canvas.getContext('2d');
        if (!ctx2d) {
            throw new Error('Failed to get canvas rendering context 2D');
        }
        this.canvas = canvas;
        this.ctx2d = ctx2d;
        this.input.setup(canvas);
    }

    unbind() {
        if (this.canvas) {
            this.input.unload(this.canvas);
            this.canvas = undefined;
            this.ctx2d = undefined;
        }
    }

    bindPreview(previewCanvas: HTMLCanvasElement) {
        const previewCtx2d = previewCanvas.getContext('2d');
        if (!previewCtx2d) {
            throw new Error('Failed to get canvas rendering context 2D');
        }
        previewCtx2d.imageSmoothingEnabled = false;
        this.previewCanvas = previewCanvas;
        this.previewCtx2d = previewCtx2d;
        this.previewInput.setup(previewCanvas);
    }

    unbindPreview() {
        if (this.previewCanvas) {
            this.previewInput.unload(this.previewCanvas);
            this.previewCanvas = undefined;
            this.previewCtx2d = undefined;
        }
    }

    // ======================== data ========================
    get activeModel() {
        return this.mode === 'modeler' ? this.model : this.animationModel;
    }

    setData<T>(node: SkeletonModelNode, componentClass: Class<SkeletonModelNodeComponent<T>>, value: T) {
        const component = node.getComponentAssert(componentClass);
        if (value !== component.value) {
            component.value = value;
            for (let watcher of this.nodeChangeWatchers) {
                watcher.onComponentChanged(this, node, componentClass);
            }
        }
        if (this.mode === 'modeler') {
            const componentInfo = skeletonModelComponentDefs[componentClass.name];
            if (componentInfo.cloneable) {
                const mirrorNode = this.activeModel.getMirrorNode(node.id);
                if (mirrorNode) {
                    const mirrorComponent = mirrorNode.getComponentAssert(componentClass);
                    if (value instanceof Map) {
                        value = new Map(value) as any;
                    } else {
                        value = cloneJson(value) as T;
                    }
                    if (componentInfo.flipFunc) {
                        value = componentInfo.flipFunc(value, node);
                    } else {
                    }
                    if (value !== mirrorComponent.value) {
                        mirrorComponent.value = value;
                        for (let watcher of this.nodeChangeWatchers) {
                            watcher.onComponentChanged(this, mirrorNode, componentClass);
                        }
                    }
                }
            }
        }
        this.activeModel.dirty = true;
    }

    // ======================== model ========================
    get selectedNode(): SkeletonModelNode | null {
        return this._selectedNode;
    }

    private getNextNodeId() {
        const stack: SkeletonModelNode[] = [];
        stack.push(...this.model.nodes);
        let id = 0;
        for (; ;) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            id = Math.max(id, node.id);
            stack.push(...node.children);
        }
        return id + 1;
    }

    getNode(id: number, model: SkeletonModel = this.model): SkeletonModelNode {
        const node = model.getNode(id);
        if (!node) {
            throw new Error(`Failed to find node #${id}`);
        }
        return node;
    }

    createNode(nodeDef: SkeletonModelNodeDef, parent?: SkeletonModelNode | null): SkeletonModelNode {
        const node = new SkeletonModelNode();
        node.type = nodeDef.name;
        node.id = this.getNextNodeId();
        for (let componentConstructor of nodeDef.components) {
            const type = componentConstructor.name;
            const component = node.components[type] = new componentConstructor();
            if (nodeDef.defaultValues.hasOwnProperty(type)) {
                component.value = cloneJson(nodeDef.defaultValues[type]);
            }
        }
        if (parent) {
            node.parent = parent;
            parent.children.push(node);
            for (let watcher of this.nodeChangeWatchers) {
                watcher.onChildAdded(this, parent, node);
            }
        } else {
            this.model.nodes.push(node);
        }
        this.model.dirty = true;
        this.model.nodeChanged = true;
        return node;
    }

    removeNode(node: SkeletonModelNode) {
        const list = node.parent ? node.parent.children : this.model.nodes;
        const index = list.findIndex(child => child.id === node.id);
        if (index < 0) {
            throw new Error('Failed to find node');
        }
        list.splice(index, 1);
        const parent = node.parent;
        node.parent = null;
        this.model.dirty = true;
        this.model.nodeChanged = true;
        if (node.id === this.selectedNodeId) {
            this.onSelectNode(0);
        }
        if (parent) {
            for (let watcher of this.nodeChangeWatchers) {
                watcher.onChildRemoved(this, parent, node);
            }
        }
    }

    moveNode(target: SkeletonModelNode, related: SkeletonModelNode, position: 'before' | 'inside' | 'after') {
        const oldParent = target.parent ? target.parent : null;
        const oldList = oldParent ? oldParent.children : this.model.nodes;
        const oldIndex = oldList.findIndex(child => child.id === target.id);
        if (oldIndex < 0) {
            throw new Error('Failed to find node');
        }
        oldList.splice(oldIndex, 1);
        if (position === 'inside') {
            related.children.push(target);
            target.parent = related;
        } else {
            const list = related.parent ? related.parent.children : this.model.nodes;
            const index = Math.max(0, list.findIndex(child => child.id === related.id) + (position === 'after' ? 1 : 0));
            list.splice(index, 0, target);
            target.parent = related.parent;
        }
        for (let watcher of this.nodeChangeWatchers) {
            watcher.onMoved(this, oldParent, target.parent, target);
        }
        this.model.dirty = true;
        this.model.nodeChanged = true;
    }

    clone(target: SkeletonModelNode, mirror: boolean, parent: SkeletonModelNode | null = target.parent) {
        const nodeDef = skeletonModelNodeDefs[target.type];
        const ret = this.createNode(nodeDef, parent);
        ret.expanded = target.expanded;
        if (mirror) {
            const retMirrorNodeId = ret.getComponent(MirrorNodeId);
            if (retMirrorNodeId) {
                retMirrorNodeId.value = target.id;
            }
        }
        for (let child of target.children) {
            this.clone(child, mirror, ret);
        }
        for (let componentClass of nodeDef.components) {
            const componentDef = skeletonModelComponentDefs[componentClass.name];
            if (componentDef.cloneable || componentClass.name === Name.name) {
                let value = target.getValue(componentClass);
                if (value instanceof Map) {
                    value = new Map(value);
                } else {
                    value = cloneJson(value);
                }
                if (mirror) {
                    if (componentDef.flipFunc) {
                        value = componentDef.flipFunc(value, target);
                    }
                }
                this.setData(ret, componentClass, value);
            }
        }
        return ret;
    }

    // ======================== animation ========================
    prepareAnimationModel() {
        this.animationModel.nodes = [];
        for (let node of this.model.nodes) {
            this.cloneNodeToAnimationModel(node, null);
        }
        this.animationModel.dirty = true;
        this.animationModel.nodeChanged = true;
    }

    private cloneNodeToAnimationModel(target: SkeletonModelNode, parent: SkeletonModelNode | null) {
        const nodeDef = skeletonModelNodeDefs[target.type];
        const node = new SkeletonModelNode();
        node.type = nodeDef.name;
        node.id = target.id;
        for (let componentConstructor of nodeDef.components) {
            const type = componentConstructor.name;
            const component = node.components[type] = new componentConstructor();
            if (nodeDef.defaultValues.hasOwnProperty(type)) {
                component.value = cloneJson(nodeDef.defaultValues[type]);
            }
        }
        if (parent) {
            node.parent = parent;
            parent.children.push(node);
        } else {
            this.animationModel.nodes.push(node);
        }
        node.expanded = target.expanded;
        for (let child of target.children) {
            this.cloneNodeToAnimationModel(child, node);
        }
        for (let componentClass of nodeDef.components) {
            const componentDef = skeletonModelComponentDefs[componentClass.name];
            if (componentDef.storable) {
                let value = target.getValue(componentClass);
                if (value instanceof Map) {
                    value = new Map(value);
                } else {
                    value = cloneJson(value);
                }
                this.setData(node, componentClass, value);
            }
        }
    }

    getAnimation(id: number): SkeletonAnimation {
        const animation = this.animations.find(animation => animation.id === id);
        if (!animation) {
            throw new Error(`Failed to find animation #${id}`);
        }
        return animation;
    }

    private getNextAnimationId() {
        return this.animations.reduce((id, animation) => Math.max(id, animation.id), 0) + 1;
    }

    createAnimation() {
        const animation = new SkeletonAnimation();
        animation.id = this.getNextAnimationId();
        this.animations.push(animation);
        return animation;
    }

    cloneAnimation(animation: SkeletonAnimation) {
        const ret = this.createAnimation();
        ret.frameDuration = animation.frameDuration;
        ret.keyframes = animation.keyframes.map(keyframe => {
            const ret = new SkeletonAnimationKeyframe(keyframe.time, keyframe.nodeId, keyframe.component);
            ret.value = cloneJson(keyframe.value);
            return ret;
        });
        return ret;
    }

    removeAnimation(animation: SkeletonAnimation) {
        let index = this.animations.indexOf(animation);
        if (index < 0) {
            throw new Error(`Failed to find animation #${animation.id}`);
        }
        this.animations.splice(index, 1);
        if (animation.id === this.currentAnimationId) {
            this.onSelectAnimation(0);
        }
    }

    findKeyframe(animation: SkeletonAnimation, time: number, nodeId: number, component: string) {
        return animation.keyframes.find(
            keyframe =>
                keyframe.time === time
                && keyframe.nodeId === nodeId
                && keyframe.component === component
        ) || null;
    }

    setKeyframe(animation: SkeletonAnimation, time: number, nodeId: number, component: string, value: any) {
        let keyframe = this.findKeyframe(animation, time, nodeId, component);
        if (!keyframe) {
            keyframe = new SkeletonAnimationKeyframe(time, nodeId, component);
            animation.keyframes.push(keyframe);
        }
        keyframe.value = value;
        return keyframe;
    }

    removeKeyframe(animation: SkeletonAnimation, time: number, nodeId: number, component: string) {
        const index = animation.keyframes.findIndex(
            keyframe =>
                keyframe.time === time
                && keyframe.nodeId === nodeId
                && keyframe.component === component
        );
        if (index >= 0) {
            animation.keyframes.splice(index, 1);
        }
    }

    private updateAnimationModel(time: number) {
        const animation = this.getAnimation(this.currentAnimationId);
        const keyframes0 = new Map<string, SkeletonAnimationKeyframe>();
        const keyframes1 = new Map<string, SkeletonAnimationKeyframe>();
        const hashes = new Set<string>();
        for (let keyframe of animation.keyframes) {
            hashes.add(keyframe.hash);
            let existed0 = keyframes0.get(keyframe.hash);
            if (!existed0 || keyframe.time < existed0.time) {
                keyframes0.set(keyframe.hash, keyframe);
            }
            let existed1 = keyframes1.get(keyframe.hash);
            if (!existed1 || keyframe.time > existed1.time) {
                keyframes1.set(keyframe.hash, keyframe);
            }
        }
        for (let keyframe of animation.keyframes) {
            if (keyframe.time <= time) {
                let existed0 = keyframes0.get(keyframe.hash);
                if (!existed0 || Math.abs(existed0.time - time) > Math.abs(keyframe.time - time)) {
                    keyframes0.set(keyframe.hash, keyframe);
                }
            }
            if (keyframe.time >= time) {
                let existed1 = keyframes1.get(keyframe.hash);
                if (!existed1 || Math.abs(existed1.time - time) > Math.abs(keyframe.time - time)) {
                    keyframes1.set(keyframe.hash, keyframe);
                }
            }
        }
        for (let hash of hashes.values()) {
            let keyframe0 = keyframes0.get(hash);
            let keyframe1 = keyframes1.get(hash);
            const keyframe = keyframe0 || keyframe1;
            if (!keyframe) {
                continue;
            }
            keyframe0 = keyframe0 || keyframe;
            keyframe1 = keyframe1 || keyframe;
            const node = this.animationModel.getNode(keyframe.nodeId);
            if (!node) {
                continue;
            }
            const componentInfo = skeletonModelComponentDefs[keyframe.component];
            if (!componentInfo.interpFunc) {
                throw new Error(`Failed to get interpFunc of ${componentInfo.constructor.name}`);
            }
            const time0 = keyframe0.time;
            const time1 = keyframe1.time;
            let value: any;
            if (time0 === time1) {
                value = keyframe1.value;
            } else {
                const t = Math.max(0, Math.min(1, (time - time0) / ((time1 - time0) || 1)));
                value = componentInfo.interpFunc(keyframe0.value, keyframe1.value, t);
            }
            if (node.getComponent(componentInfo.constructor)) {
                this.setData(node, componentInfo.constructor, value);
            }
        }
    }

    // ======================== update ========================
    update() {
        this._selectedNode = this.selectedNodeId ? this.getNode(this.selectedNodeId, this.activeModel) : null;
        this._currentAnimation = this.currentAnimationId ? this.getAnimation(this.currentAnimationId) : null;
        if (this.mode === 'animator' && this._currentAnimation && this.animationModelNeedsUpdate) {
            this.updateAnimationModel(this.time);
            this.animationModelNeedsUpdate = false;
        }
        for (let system of this.updateSystems) {
            system.update(this);
        }
        this.input.update();
        this.previewInput.update();
    }

}
