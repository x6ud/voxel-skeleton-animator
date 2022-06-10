import {mat4, quat, ReadonlyVec3, vec3} from 'gl-matrix';
import {setBufferVec4FromNum} from '../../utils/buffer';
import {quatFromTwoVec, vecScaleAddVecScale} from '../../utils/geometry/math';
import {raycastPlane} from '../../utils/geometry/raycast';
import Rotation from '../components/Rotation';
import Ring from '../../utils/meshes/Ring';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import icon from './rotate.png';
import SkeletonEngineTool from './SkeletonEngineTool';

const ROTATE_HANDLER_RADIUS = 5;
const ROTATE_HANDLER_VIEW_SCALE = 1 / 60;
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
const _vec = vec3.create();
const _detRotation = quat.create();

export default class Rotate extends SkeletonEngineTool {

    name = Rotate.name;
    label = 'Rotate';
    icon = icon;

    private readonly ringX = new Ring();
    private readonly ringY = new Ring();
    private readonly ringZ = new Ring();
    private handlerVisible: boolean = false;

    private rotateOrigin = vec3.create();
    private dragStartRotation = quat.create();
    private dragStartInvTransform = mat4.create();
    private localRotateOrigin = vec3.create();
    private dragStartLocalPoint = vec3.create();
    private dragStartLocalVec = vec3.create();

    private isVertical: boolean = false;
    private tangent = vec3.create();
    private radius: number = 1;

    constructor() {
        super();
        this.ringX.color = [0xF5 / 0xff, 0x6C / 0xff, 0x6C / 0xff, 1];
        this.ringY.color = [0x40 / 0xff, 0x9E / 0xff, 0xFF / 0xff, 1];
        this.ringZ.color = [0x67 / 0xff, 0xC2 / 0xff, 0x3A / 0xff, 1];
        this.ringX.radius = ROTATE_HANDLER_RADIUS;
        this.ringY.radius = ROTATE_HANDLER_RADIUS;
        this.ringZ.radius = ROTATE_HANDLER_RADIUS;
        this.ringY.rotateZ(Math.PI / 2);
        this.ringZ.rotateY(-Math.PI / 2);
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
        const worldMatrix = selected.getWorldMatrix();
        const scale = vec3.distance(engine.camera.target, engine.camera.position) * ROTATE_HANDLER_VIEW_SCALE;
        vec3.set(_vecScale, scale, scale, scale);
        mat4.getTranslation(_vecPos, worldMatrix);
        this.ringX.position = _vecPos;
        this.ringX.scale = _vecScale;
        this.ringY.position = _vecPos;
        this.ringY.scale = _vecScale;
        this.ringZ.position = _vecPos;
        this.ringZ.scale = _vecScale;
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
        let rotateAxis: ReadonlyVec3;
        switch (engine.draggingObjectType) {
            case SkeletonObjectType.ROTATE_HANDLER_X:
                rotateAxis = X_AXIS;
                break;
            case SkeletonObjectType.ROTATE_HANDLER_Y:
                rotateAxis = Y_AXIS;
                break;
            case SkeletonObjectType.ROTATE_HANDLER_Z:
                rotateAxis = Z_AXIS;
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
        const worldMatrix = selected.getWorldMatrix();
        const input = engine.input;
        if (input.mouseLeftDownThisFrame) {
            vec3.transformMat4(this.rotateOrigin, ZERO, worldMatrix);
            quat.copy(this.dragStartRotation, rotation.value);
            mat4.invert(this.dragStartInvTransform, worldMatrix);
            vec3.transformMat4(this.localRotateOrigin, this.rotateOrigin, this.dragStartInvTransform);
            this.isVertical = Math.abs(vec3.dot(engine.mouseNormal, rotateAxis)) < 1e-6;
            if (this.isVertical) {
                vec3.cross(this.tangent, engine.mouseNormal, rotateAxis);
                vec3.normalize(this.tangent, this.tangent);
                this.radius = vec3.distance(engine.camera.target, engine.camera.position) * ROTATE_HANDLER_VIEW_SCALE * ROTATE_HANDLER_RADIUS;
            }
        }
        if (this.isVertical) {
            vec3.sub(_vec, engine.mouseRay0, this.rotateOrigin);
            let u = vec3.dot(_vec, this.tangent);
            if (Math.abs(u) > this.radius) {
                u = Math.sign(u) * this.radius;
            }
            const v = Math.sqrt(this.radius ** 2 - u ** 2);
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
            rotateAxis[0],
            rotateAxis[1],
            rotateAxis[2],
        )) {
            return;
        }
        if (input.mouseLeftDownThisFrame) {
            vec3.transformMat4(this.dragStartLocalPoint, _draggingPoint, this.dragStartInvTransform);
            vec3.sub(this.dragStartLocalVec, this.dragStartLocalPoint, this.localRotateOrigin);
            return;
        }
        vec3.transformMat4(_draggingPoint, _draggingPoint, this.dragStartInvTransform);
        vec3.sub(_vec, _draggingPoint, this.localRotateOrigin);
        quatFromTwoVec(_detRotation, this.dragStartLocalVec, _vec);
        const result: [number, number, number, number] = [0, 0, 0, 1];
        quat.mul(result, this.dragStartRotation, _detRotation);
        engine.onSetNodeValues([{node: selected, component: Rotation, value: result}]);
    }

}
