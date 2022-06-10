import {mat4, quat, ReadonlyVec3, vec3} from 'gl-matrix';
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

const _vecScale = vec3.create();
const _vecType = new Float32Array(4);
const _vecId = new Float32Array(4);
const _draggingPoint = vec3.create();
const _detTranslation = vec3.create();
const _rotation = quat.create();

export default class MoveLocal extends SkeletonEngineTool {

    name = MoveLocal.name;
    label = 'Move';
    icon = icon;

    private readonly arrowX = new Arrow();
    private readonly arrowY = new Arrow();
    private readonly arrowZ = new Arrow();
    private handlerVisible: boolean = false;
    private origin = vec3.create();
    private axis = vec3.create();
    private localAxis = vec3.create();
    private dragStartTranslation = vec3.create();
    private dragStartInvTransform = mat4.create();
    private dragStartLocalPoint = vec3.create();

    constructor() {
        super();
        this.arrowX.color = [0xF5 / 0xff, 0x6C / 0xff, 0x6C / 0xff, 1];
        this.arrowY.color = [0x67 / 0xff, 0xC2 / 0xff, 0x3A / 0xff, 1];
        this.arrowZ.color = [0x40 / 0xff, 0x9E / 0xff, 0xFF / 0xff, 1];
    }

    onPreSolve(engine: SkeletonEngine): void {
        this.handlerVisible = false;
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const translation = selected.getComponent(Translation);
        if (!(translation)) {
            return;
        }
        const scale = vec3.distance(engine.camera.target, engine.camera.position) / 60;
        vec3.set(_vecScale, scale, scale, scale);
        this.arrowX.matrix = this.arrowY.matrix = this.arrowZ.matrix = selected.getWorldMatrix();
        this.arrowY.rotateZ(Math.PI / 2);
        this.arrowZ.rotateY(-Math.PI / 2);
        this.arrowX.scale = _vecScale;
        this.arrowY.scale = _vecScale;
        this.arrowZ.scale = _vecScale;
        this.handlerVisible = true;
    }

    onRender(engine: SkeletonEngine): void {
        if (!this.handlerVisible) {
            return;
        }
        const renderer = engine.renderer;
        renderer.depthTest(false);
        renderer.useShader(engine.plainShader);
        renderer.blendMode(renderer.BLEND_MODE_PIGMENT);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        uniformColor(engine, SkeletonObjectType.MOVE_HANDLER_ARROW_X);
        this.arrowX.render(renderer);
        uniformColor(engine, SkeletonObjectType.MOVE_HANDLER_ARROW_Y);
        this.arrowY.render(renderer);
        uniformColor(engine, SkeletonObjectType.MOVE_HANDLER_ARROW_Z);
        this.arrowZ.render(renderer);
    }

    onRenderPicking(engine: SkeletonEngine): void {
        if (!this.handlerVisible) {
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
        this.arrowX.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.MOVE_HANDLER_ARROW_Y);
        renderer.uniform('u_type', _vecType);
        this.arrowY.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.MOVE_HANDLER_ARROW_Z);
        renderer.uniform('u_type', _vecType);
        this.arrowZ.render(renderer);
    }

    onPostSolve(engine: SkeletonEngine): void {
        let axis: ReadonlyVec3;
        switch (engine.draggingObjectType) {
            case SkeletonObjectType.MOVE_HANDLER_ARROW_X:
                axis = X_AXIS;
                break;
            case SkeletonObjectType.MOVE_HANDLER_ARROW_Y:
                axis = Y_AXIS;
                break;
            case SkeletonObjectType.MOVE_HANDLER_ARROW_Z:
                axis = Z_AXIS;
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
        const input = engine.input;
        if (input.mouseLeftDownThisFrame) {
            const matrix = selected.getWorldMatrix();
            mat4.getTranslation(this.origin, matrix);
            vec3.copy(this.dragStartTranslation, translation.value);
            mat4.invert(this.dragStartInvTransform, selected.getParentWorldMatrix());
            vec3.transformMat4(this.axis, axis, matrix);
            vec3.sub(this.axis, this.axis, this.origin);
            vec3.normalize(this.axis, this.axis);
            mat4.getRotation(_rotation, this.dragStartInvTransform);
            vec3.transformQuat(this.localAxis, this.axis, _rotation);
        }
        if (closestPointsBetweenTwoLines(
            _draggingPoint,
            null,
            this.origin[0],
            this.origin[1],
            this.origin[2],
            this.axis[0],
            this.axis[1],
            this.axis[2],
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
            vec3.transformMat4(this.dragStartLocalPoint, _draggingPoint, this.dragStartInvTransform);
            return;
        }
        vec3.transformMat4(_draggingPoint, _draggingPoint, this.dragStartInvTransform);
        vec3.sub(_detTranslation, _draggingPoint, this.dragStartLocalPoint);
        const result: [number, number, number] = [0, 0, 0];
        vec3.add(result, this.dragStartTranslation, _detTranslation);
        if (input.isKeyPressed('Shift')) {
            const proj0 = vec3.dot(result, this.localAxis);
            const det = 0.5;
            const proj1 = Math.round(proj0 / det) * det;
            vec3.scale(_detTranslation, this.localAxis, proj1 - proj0);
            vec3.add(result, result, _detTranslation);
        }
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
