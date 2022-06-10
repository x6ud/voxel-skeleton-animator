import {mat4, quat, ReadonlyVec3, vec3} from 'gl-matrix';
import {setBufferVec4FromNum} from '../../utils/buffer';
import {quatDecompose, quatFromTwoVec, vecScaleAddVecScale} from '../../utils/geometry/math';
import {raycastPlane} from '../../utils/geometry/raycast';
import Rotation from '../components/Rotation';
import Ring from '../../utils/meshes/Ring';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import icon from './rotate.png';
import SkeletonEngineTool from './SkeletonEngineTool';

const HANDLER_VIEW_SCALE = 1 / 60;
const NORMAL_COLOR = [1, 1, 1, 1];
const ACTIVE_COLOR = [1.5, 1.5, 1.5, 1];
const X_AXIS: ReadonlyVec3 = [1, 0, 0];
const Y_AXIS: ReadonlyVec3 = [0, 1, 0];
const Z_AXIS: ReadonlyVec3 = [0, 0, 1];

const _scale = vec3.create();
const _vecType = new Float32Array(4);
const _vecId = new Float32Array(4);
const _draggingPoint = vec3.create();
const _vec = vec3.create();
const _rotation = quat.create();
const _detRotation = quat.create();
const _swing = quat.create();
const _twist = quat.create();
const _twistAxis = vec3.create();

export default class RotateLocal extends SkeletonEngineTool {

    name = RotateLocal.name;
    label = 'Rotate';
    icon = icon;

    private readonly ringX = new Ring();
    private readonly ringY = new Ring();
    private readonly ringZ = new Ring();
    private handlerVisible: boolean = false;

    private rotateOrigin = vec3.create();
    private dragStartRotation = quat.create();
    private dragStartInvMat = mat4.create();
    private dragStartLocalPoint = vec3.create();
    private rotateAxis = vec3.create();
    private isVertical: boolean = false;
    private tangent = vec3.create();
    private radius: number = 1;

    constructor() {
        super();
        this.ringX.color = [0xF5 / 0xff, 0x6C / 0xff, 0x6C / 0xff, 1];
        this.ringY.color = [0x40 / 0xff, 0x9E / 0xff, 0xFF / 0xff, 1];
        this.ringZ.color = [0x40 / 0xff, 0x9E / 0xff, 0xFF / 0xff, 1];
        this.ringX.radius = 5;
        this.ringY.radius = 4;
        this.ringZ.radius = 4;
    }

    onPreSolve(engine: SkeletonEngine): void {
        this.handlerVisible = false;
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const rotation = selected.getComponent(Rotation);
        if (!rotation) {
            return;
        }
        this.ringX.matrix = this.ringY.matrix = this.ringZ.matrix = selected.getWorldMatrix();
        this.ringY.rotateZ(Math.PI / 2);
        this.ringZ.rotateY(-Math.PI / 2);
        const scale = vec3.distance(engine.camera.target, engine.camera.position) * HANDLER_VIEW_SCALE;
        vec3.set(_scale, scale, scale, scale);
        this.ringX.scale = _scale;
        this.ringY.scale = _scale;
        this.ringZ.scale = _scale;
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
        if (engine.draggingObjectType === SkeletonObjectType.NONE
            || engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_X
        ) {
            renderer.uniform(
                'u_color',
                engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_X
                || engine.hoveredObjectType === SkeletonObjectType.ROTATE_HANDLER_X
                    ? ACTIVE_COLOR
                    : NORMAL_COLOR);
            this.ringX.render(renderer);
        }
        if (engine.draggingObjectType === SkeletonObjectType.NONE
            || engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_Y
        ) {
            renderer.uniform(
                'u_color',
                engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_Y
                || engine.hoveredObjectType === SkeletonObjectType.ROTATE_HANDLER_Y
                    ? ACTIVE_COLOR
                    : NORMAL_COLOR);
            this.ringY.render(renderer);
        }
        if (engine.draggingObjectType === SkeletonObjectType.NONE
            || engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_Z
        ) {
            renderer.uniform(
                'u_color',
                engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_Z
                || engine.hoveredObjectType === SkeletonObjectType.ROTATE_HANDLER_Z
                    ? ACTIVE_COLOR
                    : NORMAL_COLOR);
            this.ringZ.render(renderer);
        }
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
        if (engine.draggingObjectType === SkeletonObjectType.NONE
            || engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_X
        ) {
            setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.ROTATE_HANDLER_X);
            renderer.uniform('u_type', _vecType);
            this.ringX.render(renderer);
        }
        if (engine.draggingObjectType === SkeletonObjectType.NONE
            || engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_Y
        ) {
            setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.ROTATE_HANDLER_Y);
            renderer.uniform('u_type', _vecType);
            this.ringY.render(renderer);
        }
        if (engine.draggingObjectType === SkeletonObjectType.NONE
            || engine.draggingObjectType === SkeletonObjectType.ROTATE_HANDLER_Z
        ) {
            setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.ROTATE_HANDLER_Z);
            renderer.uniform('u_type', _vecType);
            this.ringZ.render(renderer);
        }
    }

    onPostSolve(engine: SkeletonEngine): void {
        if (!this.handlerVisible) {
            return;
        }
        switch (engine.draggingObjectType) {
            case SkeletonObjectType.ROTATE_HANDLER_X:
            case SkeletonObjectType.ROTATE_HANDLER_Y:
            case SkeletonObjectType.ROTATE_HANDLER_Z:
                break;
            default:
                return;
        }
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const rotation = selected.getComponent(Rotation);
        if (!rotation) {
            return;
        }
        const input = engine.input;
        if (input.mouseLeftDownThisFrame) {
            switch (engine.draggingObjectType) {
                case SkeletonObjectType.ROTATE_HANDLER_X:
                    vec3.copy(this.rotateAxis, X_AXIS);
                    this.radius = this.ringX.radius;
                    break;
                case SkeletonObjectType.ROTATE_HANDLER_Y:
                    vec3.copy(this.rotateAxis, Y_AXIS);
                    this.radius = this.ringY.radius;
                    break;
                case SkeletonObjectType.ROTATE_HANDLER_Z:
                    vec3.copy(this.rotateAxis, Z_AXIS);
                    this.radius = this.ringZ.radius;
                    break;
                default:
                    return;
            }
            const matrix = selected.getWorldMatrix();
            mat4.getTranslation(this.rotateOrigin, matrix);
            quat.copy(this.dragStartRotation, rotation.value);
            mat4.invert(this.dragStartInvMat, matrix);
            mat4.getRotation(_rotation, matrix);
            vec3.transformQuat(this.rotateAxis, this.rotateAxis, _rotation);
            if (raycastPlane(
                this.dragStartLocalPoint,
                engine.mouseRay0[0],
                engine.mouseRay0[1],
                engine.mouseRay0[2],
                engine.mouseRay1[0],
                engine.mouseRay1[1],
                engine.mouseRay1[2],
                this.rotateOrigin[0],
                this.rotateOrigin[1],
                this.rotateOrigin[2],
                this.rotateAxis[0],
                this.rotateAxis[1],
                this.rotateAxis[2],
            )) {
                this.isVertical = false;
            } else {
                this.isVertical = true;
                vec3.cross(this.tangent, engine.mouseNormal, this.rotateAxis);
                vec3.normalize(this.tangent, this.tangent);
                vec3.sub(_vec, engine.mouseRay0, this.rotateOrigin);
                let u = vec3.dot(_vec, this.tangent);
                if (Math.abs(u) > this.radius) {
                    u = Math.sign(u) * this.radius;
                }
                const v = -Math.sqrt(this.radius ** 2 - u ** 2);
                vecScaleAddVecScale(this.dragStartLocalPoint, this.tangent, u, engine.mouseNormal, v);
                vec3.add(this.dragStartLocalPoint, this.dragStartLocalPoint, this.rotateOrigin);
            }
            vec3.transformMat4(this.dragStartLocalPoint, this.dragStartLocalPoint, this.dragStartInvMat);
            return;
        }
        if (this.isVertical) {
            vec3.sub(_vec, engine.mouseRay0, this.rotateOrigin);
            let u = vec3.dot(_vec, this.tangent);
            if (Math.abs(u) > this.radius) {
                u = Math.sign(u) * this.radius;
            }
            const v = -Math.sqrt(this.radius ** 2 - u ** 2);
            vecScaleAddVecScale(_draggingPoint, this.tangent, u, engine.mouseNormal, v);
            vec3.add(_draggingPoint, _draggingPoint, this.rotateOrigin);
        } else if (!raycastPlane(
            _draggingPoint,
            engine.mouseRay0[0],
            engine.mouseRay0[1],
            engine.mouseRay0[2],
            engine.mouseRay1[0],
            engine.mouseRay1[1],
            engine.mouseRay1[2],
            this.rotateOrigin[0],
            this.rotateOrigin[1],
            this.rotateOrigin[2],
            this.rotateAxis[0],
            this.rotateAxis[1],
            this.rotateAxis[2],
        )) {
            return;
        }
        vec3.transformMat4(_draggingPoint, _draggingPoint, this.dragStartInvMat);
        quatFromTwoVec(_detRotation, this.dragStartLocalPoint, _draggingPoint);
        const result: [number, number, number, number] = [0, 0, 0, 1];
        quat.mul(result, this.dragStartRotation, _detRotation);
        if (input.isKeyPressed('Shift')) {
            switch (engine.draggingObjectType) {
                case SkeletonObjectType.ROTATE_HANDLER_X:
                    vec3.copy(_twistAxis, X_AXIS);
                    break;
                case SkeletonObjectType.ROTATE_HANDLER_Y:
                    vec3.copy(_twistAxis, Y_AXIS);
                    break;
                case SkeletonObjectType.ROTATE_HANDLER_Z:
                    vec3.copy(_twistAxis, Z_AXIS);
                    break;
            }
            quatDecompose(_swing, _twist, result, _twistAxis);
            let angle = quat.getAxisAngle(_twistAxis, _twist);
            const detAngle = Math.PI / 180 * 45;
            angle = Math.round(angle / detAngle) * detAngle;
            quat.setAxisAngle(_twist, _twistAxis, angle);
            quat.mul(result, _swing, _twist);
        }
        engine.onSetNodeValues([{node: selected, component: Rotation, value: result}]);
    }

}
