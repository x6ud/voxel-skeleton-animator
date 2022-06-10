import {mat4, ReadonlyVec3, vec3} from 'gl-matrix';
import {setBufferVec4FromNum} from '../../utils/buffer';
import {closestPointsBetweenTwoLines} from '../../utils/geometry/math';
import Arrow from '../../utils/meshes/Arrow';
import Translation from '../components/Translation';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import icon from './move.png';
import SkeletonEngineTool from './SkeletonEngineTool';

const NORMAL_COLOR = [1, 1, 1, 1];
const ACTIVE_COLOR = [1.5, 1.5, 1.5, 1];
const X_AXIS: ReadonlyVec3 = [1, 0, 0];
const Y_AXIS: ReadonlyVec3 = [0, 1, 0];
const Z_AXIS: ReadonlyVec3 = [0, 0, 1];
const ZERO: ReadonlyVec3 = [0, 0, 0];

const _vecPos = vec3.create();
const _vecScale = vec3.create();
const _vecType = new Float32Array(4);
const _vecId = new Float32Array(4);
const _draggingPoint = vec3.create();
const _detTranslation = vec3.create();

export default class Move extends SkeletonEngineTool {

    name = Move.name;
    label = 'Move';
    icon = icon;

    private readonly moveHandlerArrowX = new Arrow();
    private readonly moveHandlerArrowY = new Arrow();
    private readonly moveHandlerArrowZ = new Arrow();
    private moveHandlerVisible: boolean = false;
    private origin = vec3.create();
    private dragStartTranslation = vec3.create();
    private dragStartInvTransform = mat4.create();
    private dragStartLocalPoint = vec3.create();

    constructor() {
        super();
        this.moveHandlerArrowX.color = [0xF5 / 0xff, 0x6C / 0xff, 0x6C / 0xff, 1];
        this.moveHandlerArrowY.color = [0x40 / 0xff, 0x9E / 0xff, 0xFF / 0xff, 1];
        this.moveHandlerArrowZ.color = [0x67 / 0xff, 0xC2 / 0xff, 0x3A / 0xff, 1];
        this.moveHandlerArrowY.rotateZ(Math.PI / 2);
        this.moveHandlerArrowZ.rotateY(-Math.PI / 2);
    }

    onPreSolve(engine: SkeletonEngine): void {
        this.moveHandlerVisible = false;
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const translation = selected.getComponent(Translation);
        if (!(translation)) {
            return;
        }
        const worldMatrix = selected.getWorldMatrix();
        const scale = vec3.distance(engine.camera.target, engine.camera.position) / 60;
        vec3.set(_vecScale, scale, scale, scale);
        mat4.getTranslation(_vecPos, worldMatrix);
        this.moveHandlerArrowX.position = _vecPos;
        this.moveHandlerArrowY.position = _vecPos;
        this.moveHandlerArrowZ.position = _vecPos;
        this.moveHandlerArrowX.scale = _vecScale;
        this.moveHandlerArrowY.scale = _vecScale;
        this.moveHandlerArrowZ.scale = _vecScale;
        this.moveHandlerVisible = true;
    }

    onRender(engine: SkeletonEngine): void {
        if (!this.moveHandlerVisible) {
            return;
        }
        const renderer = engine.renderer;
        renderer.depthTest(false);
        renderer.useShader(engine.plainShader);
        renderer.blendMode(renderer.BLEND_MODE_PIGMENT);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        uniformColor(engine, SkeletonObjectType.MOVE_HANDLER_ARROW_X);
        this.moveHandlerArrowX.render(renderer);
        uniformColor(engine, SkeletonObjectType.MOVE_HANDLER_ARROW_Y);
        this.moveHandlerArrowY.render(renderer);
        uniformColor(engine, SkeletonObjectType.MOVE_HANDLER_ARROW_Z);
        this.moveHandlerArrowZ.render(renderer);
    }

    onRenderPicking(engine: SkeletonEngine): void {
        if (!this.moveHandlerVisible) {
            return;
        }
        const renderer = engine.renderer;
        renderer.depthTest(false);
        renderer.useShader(engine.pickingShader);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        setBufferVec4FromNum(_vecId, 0, engine.selectedNode?.id || 0);
        renderer.uniform('u_id', _vecId);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.MOVE_HANDLER_ARROW_X);
        renderer.uniform('u_type', _vecType);
        this.moveHandlerArrowX.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.MOVE_HANDLER_ARROW_Y);
        renderer.uniform('u_type', _vecType);
        this.moveHandlerArrowY.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.MOVE_HANDLER_ARROW_Z);
        renderer.uniform('u_type', _vecType);
        this.moveHandlerArrowZ.render(renderer);
    }

    onPostSolve(engine: SkeletonEngine): void {
        let translateAxis: ReadonlyVec3;
        switch (engine.draggingObjectType) {
            case SkeletonObjectType.MOVE_HANDLER_ARROW_X:
                translateAxis = X_AXIS;
                break;
            case SkeletonObjectType.MOVE_HANDLER_ARROW_Y:
                translateAxis = Y_AXIS;
                break;
            case SkeletonObjectType.MOVE_HANDLER_ARROW_Z:
                translateAxis = Z_AXIS;
                break;
            default:
                return;
        }
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const translation = selected.getComponent(Translation);
        if (!translation) {
            return;
        }
        const worldMatrix = selected.getWorldMatrix();
        const input = engine.input;
        if (input.mouseLeftDownThisFrame) {
            vec3.transformMat4(this.origin, ZERO, worldMatrix);
            vec3.copy(this.dragStartTranslation, translation.value);
            mat4.invert(this.dragStartInvTransform, selected.getParentWorldMatrix());
        }
        if (closestPointsBetweenTwoLines(
            _draggingPoint,
            null,
            this.origin[0],
            this.origin[1],
            this.origin[2],
            translateAxis[0],
            translateAxis[1],
            translateAxis[2],
            engine.mouseRay0[0],
            engine.mouseRay0[1],
            engine.mouseRay0[2],
            engine.mouseNormal[0],
            engine.mouseNormal[1],
            engine.mouseNormal[2],
        )) {
            return;
        }
        if (input.mouseLeftDownThisFrame) {
            vec3.copy(this.dragStartLocalPoint, _draggingPoint);
            vec3.transformMat4(this.dragStartLocalPoint, this.dragStartLocalPoint, this.dragStartInvTransform);
            return;
        }
        vec3.transformMat4(_draggingPoint, _draggingPoint, this.dragStartInvTransform);
        vec3.sub(_detTranslation, _draggingPoint, this.dragStartLocalPoint);
        const result: [number, number, number] = [0, 0, 0];
        vec3.add(result, this.dragStartTranslation, _detTranslation);
        engine.onSetNodeValues([{node: selected, component: Translation, value: result}]);
    }

}

function uniformColor(engine: SkeletonEngine, type: SkeletonObjectType) {
    const renderer = engine.renderer;
    if (engine.hoveredObjectType === type || engine.draggingObjectType === type) {
        renderer.uniform('u_color', ACTIVE_COLOR);
    } else {
        renderer.uniform('u_color', NORMAL_COLOR);
    }
}
