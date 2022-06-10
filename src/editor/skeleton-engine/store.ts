import {vec3} from 'gl-matrix';
import JSZip from 'jszip';
import {cloneJson} from '../utils/clone';
import {JsonObject} from '../utils/type';
import {skeletonModelComponentDefs} from './component-defs';
import {skeletonModelNodeDefs} from './node-defs';
import SkeletonAnimation from './SkeletonAnimation';
import SkeletonAnimationKeyframe from './SkeletonAnimationKeyframe';
import SkeletonEngine from './SkeletonEngine';
import SkeletonModel from './SkeletonModel';
import SkeletonModelNode from './SkeletonModelNode';

export class SkeletonModelNodeJson {
    id: number = 0;
    type: string = '';
    expanded: boolean = true;
    components: { [type: string]: any } = {};
    parent: number = 0;
    index: number = 0;
    children: SkeletonModelNodeJson[] = [];
}

export function skeletonModelNodeToJson(engine: SkeletonEngine, node: SkeletonModelNode): SkeletonModelNodeJson {
    const json = new SkeletonModelNodeJson();
    json.id = node.id;
    json.type = node.type;
    json.expanded = node.expanded;
    for (let type in node.components) {
        const componentInfo = skeletonModelComponentDefs[type];
        if (componentInfo?.storable) {
            let val = node.components[type].value;
            if (componentInfo.serializeFunc) {
                val = componentInfo.serializeFunc(val);
            }
            json.components[type] = cloneJson(val);
        }
    }
    json.parent = node.parent?.id || 0;
    if (node.parent) {
        json.index = node.parent.children.indexOf(node);
    } else {
        json.index = engine.model.nodes.indexOf(node);
    }
    json.children = node.children.map(child => skeletonModelNodeToJson(engine, child));
    return json;
}

export function createSkeletonModelNodeFromJson(json: SkeletonModelNodeJson, parent?: SkeletonModelNode): SkeletonModelNode {
    const nodeDef = skeletonModelNodeDefs[json.type];
    if (!nodeDef) {
        throw new Error(`Unknown entity type ${json.type}`);
    }
    const node = new SkeletonModelNode();
    node.id = json.id;
    node.type = json.type;
    node.expanded = json.expanded;
    for (let componentConstructor of nodeDef.components) {
        const type = componentConstructor.name;
        const component = node.components[type] = new componentConstructor();
        if (json.components.hasOwnProperty(type)) {
            let val = cloneJson(json.components[type]);
            const componentInfo = skeletonModelComponentDefs[type];
            if (componentInfo.deserializeFunc) {
                val = componentInfo.deserializeFunc(val);
            }
            component.value = val;
        } else if (nodeDef.defaultValues.hasOwnProperty(type)) {
            component.value = cloneJson(nodeDef.defaultValues[type]);
        }
    }
    if (parent) {
        node.parent = parent;
    }
    node.children = json.children.map(child => createSkeletonModelNodeFromJson(child, node));
    return node;
}

export function recoverSkeletonModelNodeFromJson(engine: SkeletonEngine, json: SkeletonModelNodeJson): SkeletonModelNode {
    const node = createSkeletonModelNodeFromJson(json);
    if (json.parent) {
        const parent = engine.getNode(json.parent);
        parent.children.splice(json.index, 0, node);
        node.parent = parent;
    } else {
        engine.model.nodes.splice(json.index, 0, node);
    }
    engine.model.dirty = true;
    engine.model.nodeChanged = true;
    return node;
}

export class SkeletonModelNodePositionJson {
    id: number = 0;
    parent: number = 0;
    index: number = 0;
}

export function getSkeletonModelNodePositionJson(engine: SkeletonEngine, node: SkeletonModelNode): SkeletonModelNodePositionJson {
    const json = new SkeletonModelNodePositionJson();
    json.id = node.id;
    json.parent = node.parent?.id || 0;
    if (node.parent) {
        json.index = node.parent.children.indexOf(node);
    } else {
        json.index = engine.model.nodes.indexOf(node);
    }
    return json;
}

export function recoverSkeletonModelNodePosition(engine: SkeletonEngine, json: SkeletonModelNodePositionJson) {
    const node = engine.getNode(json.id);
    const oldParent = node.parent;
    const oldList = node.parent?.children || engine.model.nodes;
    const oldIndex = oldList.findIndex(node => node.id === json.id);
    if (oldIndex >= 0) {
        oldList.splice(oldIndex, 1);
    }
    const parent = json.parent ? engine.getNode(json.parent) : null;
    const newList = parent?.children || engine.model.nodes;
    newList.splice(json.index, 0, node);
    node.parent = parent;
    for (let watcher of engine.nodeChangeWatchers) {
        watcher.onMoved(engine, oldParent, node.parent, node);
    }
    engine.model.dirty = true;
    engine.model.nodeChanged = true;
    return node;
}

export function skeletonAnimationToJson(animation: SkeletonAnimation): JsonObject<SkeletonAnimation> {
    return cloneJson(animation);
}

export function createSkeletonAnimationFromJson(json: JsonObject<SkeletonAnimation>): SkeletonAnimation {
    const animation = new SkeletonAnimation();
    animation.id = json.id;
    animation.name = json.name;
    animation.frameDuration = Number(json.frameDuration || 0) || 33;
    animation.keyframes = json.keyframes.map(createSkeletonAnimationKeyframeFromJson);
    return animation;
}

export function createSkeletonAnimationKeyframeFromJson(json: JsonObject<SkeletonAnimationKeyframe>): SkeletonAnimationKeyframe {
    const keyframe = new SkeletonAnimationKeyframe(json.time, json.nodeId, json.component);
    keyframe.value = cloneJson(json.value);
    return keyframe;
}

export function recoverSkeletonAnimationFromJson(engine: SkeletonEngine, json: JsonObject<SkeletonAnimation>): SkeletonAnimation {
    const animation = createSkeletonAnimationFromJson(json);
    engine.animations.push(animation);
    engine.animations.sort((a, b) => a.id - b.id);
    return animation;
}

class ProjectState {
    cameraPosition?: [number, number, number] = [0, 0, 0];
    cameraTarget?: [number, number, number] = [0, 0, 0];
    cameraRotateX?: number = 0;
    cameraRotateY?: number = 0;
    cameraZoom?: number = 0;
    previewCameraPosition?: [number, number, number] = [0, 0, 0];
    previewCameraTarget?: [number, number, number] = [0, 0, 0];
    color1?: number = 0;
    color2?: number = 0;
    mouseRightAsEraser?: boolean = false;
}

export function exportSkeletonProjectZip(engine: SkeletonEngine) {
    const zip = new JSZip();

    // ======================== model ========================
    const modelJson: SkeletonModelNodeJson[] = [];
    for (let node of engine.model.nodes) {
        modelJson.push(skeletonModelNodeToJson(engine, node));
    }
    zip.file('model.json', JSON.stringify(modelJson));

    // ======================== animations ========================
    zip.file('animations.json', JSON.stringify(engine.animations));

    // ======================== project state ========================
    const projectStateJson: ProjectState = new ProjectState();
    vec3.copy(projectStateJson.cameraPosition!, engine.camera.position);
    vec3.copy(projectStateJson.cameraTarget!, engine.camera.target);
    projectStateJson.cameraRotateX = engine.camera.rotateXDeg;
    projectStateJson.cameraRotateY = engine.camera.rotateYDeg;
    projectStateJson.cameraZoom = engine.camera.zoom;
    vec3.copy(projectStateJson.previewCameraPosition!, engine.previewCamera.position);
    vec3.copy(projectStateJson.previewCameraTarget!, engine.previewCamera.target);
    projectStateJson.color1 = engine.color1;
    projectStateJson.color2 = engine.color2;
    projectStateJson.mouseRightAsEraser = engine.mouseRightAsEraser;
    zip.file('project-state.json', JSON.stringify(projectStateJson));

    return zip.generateAsync({type: 'blob'});
}

export async function loadSkeletonProjectZip(buffer: ArrayBuffer, engine: SkeletonEngine) {
    const zip = new JSZip();
    await zip.loadAsync(buffer);

    engine.selectedNodeId = 0;
    engine.currentAnimationId = 0;

    // ======================== model ========================
    const modelJsonFile = zip.file('model.json');
    if (!modelJsonFile) {
        throw new Error('Failed to load model.json');
    }
    const modelJsonStr = await modelJsonFile.async('string');
    const modelJson: SkeletonModelNodeJson[] = JSON.parse(modelJsonStr);
    engine.model = new SkeletonModel();
    engine.selectedNodeId = 0;
    for (let nodeJson of modelJson) {
        engine.model.nodes.push(createSkeletonModelNodeFromJson(nodeJson));
    }

    // ======================== animations ========================
    engine.animations.length = 0;
    const animationsJsonFile = zip.file('animations.json');
    if (animationsJsonFile) {
        const animationJsonStr = await animationsJsonFile.async('string');
        const animationJson: JsonObject<SkeletonAnimation[]> = JSON.parse(animationJsonStr);
        engine.animations.push(...animationJson.map(createSkeletonAnimationFromJson));
    }

    // ======================== project state ========================
    const projectStateJsonFile = zip.file('project-state.json');
    if (projectStateJsonFile) {
        const projectStateJsonStr = await projectStateJsonFile.async('string');
        const projectStateJson: ProjectState = JSON.parse(projectStateJsonStr);
        if (projectStateJson.cameraPosition) {
            vec3.copy(engine.camera.position, projectStateJson.cameraPosition);
        }
        if (projectStateJson.cameraTarget) {
            vec3.copy(engine.camera.target, projectStateJson.cameraTarget);
        }
        engine.camera.rotateXDeg = projectStateJson.cameraRotateX || 0;
        engine.camera.rotateYDeg = projectStateJson.cameraRotateY || 0;
        engine.camera.zoom = projectStateJson.cameraZoom || 0;
        if (projectStateJson.previewCameraPosition) {
            vec3.copy(engine.previewCamera.position, projectStateJson.previewCameraPosition);
        }
        if (projectStateJson.previewCameraTarget) {
            vec3.copy(engine.previewCamera.target, projectStateJson.previewCameraTarget);
        }
        engine.color1 = projectStateJson.color1 || 0;
        engine.color2 = projectStateJson.color2 || 0;
        engine.mouseRightAsEraser = projectStateJson.mouseRightAsEraser || false;
    }
}
