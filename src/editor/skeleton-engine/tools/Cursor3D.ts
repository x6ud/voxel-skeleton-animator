import {mat4, quat, vec3} from 'gl-matrix';
import Texture from '../../../common/render/Texture';
import {setBufferVec4FromNum} from '../../utils/buffer';
import {drawArc} from '../../utils/draw-shape';
import {eulerToQuat, quatFromTwoVec, quatToEuler} from '../../utils/geometry/math';
import {raycastPlane, raycastSphere} from '../../utils/geometry/raycast';
import Length from '../components/Length';
import Rotation from '../components/Rotation';
import Translation from '../components/Translation';
import Cone from '../../utils/meshes/Cone';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import imgMoveHandler from './cursor-3d-move-handler.png';
import imgMoveMask from './cursor-3d-move-mask.png';
import imgRotateHandler from './cursor-3d-rotate-handler.png';
import imgRotateMask from './cursor-3d-rotate-mask.png';
import icon from './cursor-3d.png';
import SkeletonEngineTool from './SkeletonEngineTool';

const CONE_COLOR = [.95, .95, .95, .75];
const TWIST_INDICATOR_RADIUS = 42;

const _vecType = new Float32Array(4);
const _vecId = new Float32Array(4);
const _draggingPoint = vec3.create();
const _detTranslation = vec3.create();
const _detRotation = quat.create();
const _normal = vec3.create();
const _euler = vec3.create();
const _twistAxis = vec3.create();
const _twist = quat.create();

export default class Cursor3D extends SkeletonEngineTool {

    name = Cursor3D.name;
    label = 'Cursor 3D';
    icon = icon;
    private handlerVisible = false;
    private cone = new Cone();
    private texRotateHandler?: Texture;
    private texMoveHandler?: Texture;
    private texRotateMask?: Texture;
    private texMoveMask?: Texture;
    private startScreen = vec3.create();
    private endScreen = vec3.create();
    private dragStartTranslation = vec3.create();
    private dragStartRotation = quat.create();
    private dragOrigin = vec3.create();
    private dragStartLocalPoint = vec3.create();
    private dragNormal = vec3.create();
    private invMatrix = mat4.create();
    private radius = 0;
    private reverse = false;
    private twistAngle = 0;

    onPreSolve(engine: SkeletonEngine): void {
        this.handlerVisible = false;
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const rotation = selected.getComponent(Rotation);
        const translation = selected.getComponent(Translation);
        if (!rotation || !translation) {
            return;
        }
        const matrix = selected.getWorldMatrix();
        const size = selected.getValueOrElse(Length, 1);
        this.cone.matrix = matrix;
        this.cone.size = size;
        vec3.set(this.startScreen, 0, 0, 0);
        vec3.transformMat4(this.startScreen, this.startScreen, matrix);
        vec3.transformMat4(this.startScreen, this.startScreen, engine.camera.pvMatrix);
        vec3.set(this.endScreen, size, 0, 0);
        vec3.transformMat4(this.endScreen, this.endScreen, matrix);
        vec3.transformMat4(this.endScreen, this.endScreen, engine.camera.pvMatrix);
        this.handlerVisible = true;

        if (
            engine.draggingObjectType === SkeletonObjectType.CURSOR_3D_ROTATE_HANDLER
            && engine.input.isKeyPressed('Alt')
        ) {
            this.twistAngle = Math.atan2(engine.mouseNormalized[1] - this.endScreen[1], engine.mouseNormalized[0] - this.endScreen[0]);
            if (engine.input.isKeyPressed('Shift')) {
                const det = Math.PI / 180 * 45;
                this.twistAngle = Math.round(this.twistAngle / det) * det;
            }
            while (this.twistAngle < 0) {
                this.twistAngle += Math.PI * 2;
            }
        }

        const renderer = engine.renderer;
        if (!this.texRotateHandler) {
            this.texRotateHandler = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgRotateHandler).then(texture => this.texRotateHandler = texture);
        }
        if (!this.texMoveHandler) {
            this.texMoveHandler = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgMoveHandler).then(texture => this.texMoveHandler = texture);
        }
        if (!this.texRotateMask) {
            this.texRotateMask = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgRotateMask).then(texture => this.texRotateMask = texture);
        }
        if (!this.texMoveMask) {
            this.texMoveMask = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgMoveMask).then(texture => this.texMoveMask = texture);
        }
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
        renderer.uniform('u_color', CONE_COLOR);
        this.cone.render(renderer);

        if (this.texRotateHandler && this.texMoveHandler) {
            renderer.begin2D();
            renderer.useShader();
            const cx = this.endScreen[0] * renderer.state.width / 2;
            const cy = this.endScreen[1] * renderer.state.height / 2;
            renderer.draw(
                this.texRotateHandler,
                cx - this.texRotateHandler.width / 2,
                cy - this.texRotateHandler.height / 2,
            );
            renderer.draw(
                this.texMoveHandler,
                this.startScreen[0] * renderer.state.width / 2 - this.texMoveHandler.width / 2,
                this.startScreen[1] * renderer.state.height / 2 - this.texMoveHandler.height / 2,
            );
            if (
                engine.draggingObjectType === SkeletonObjectType.CURSOR_3D_ROTATE_HANDLER
                && engine.input.isKeyPressed('Alt')
            ) {
                renderer.setColor(1, 1, 1, 1);
                drawArc(renderer, cx, cy, TWIST_INDICATOR_RADIUS, 0, this.twistAngle);
            }
            renderer.end2D();
        }
    }

    onRenderPicking(engine: SkeletonEngine): void {
        if (!this.handlerVisible) {
            return;
        }
        const renderer = engine.renderer;
        if (this.texRotateMask && this.texMoveMask) {
            renderer.begin2D();
            renderer.useShader(engine.picking2dShader);
            setBufferVec4FromNum(_vecId, 0, engine.selectedNode?.id || 0);
            renderer.uniform('u_id', _vecId);
            setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.CURSOR_3D_ROTATE_HANDLER);
            renderer.uniform('u_type', _vecType);
            renderer.draw(
                this.texRotateMask,
                this.endScreen[0] * renderer.state.width / 2 - this.texRotateMask.width / 2,
                this.endScreen[1] * renderer.state.height / 2 - this.texRotateMask.height / 2,
            );
            setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.CURSOR_3D_MOVE_HANDLER);
            renderer.uniform('u_type', _vecType);
            renderer.draw(
                this.texMoveMask,
                this.startScreen[0] * renderer.state.width / 2 - this.texMoveMask.width / 2,
                this.startScreen[1] * renderer.state.height / 2 - this.texMoveMask.height / 2,
            );
            renderer.end2D();
        }
    }

    onPostSolve(engine: SkeletonEngine): void {
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        switch (engine.draggingObjectType) {
            // ========================== reset ==========================
            case SkeletonObjectType.NONE: {
                if (engine.input.isKeyPressed('r')) {
                    if (!selected.getComponent(Rotation)) {
                        return;
                    }
                    engine.setData(selected, Rotation, [0, 0, 0, 1]);
                }
            }
                break;

            // ========================== rotation ==========================
            case SkeletonObjectType.CURSOR_3D_ROTATE_HANDLER: {
                const rotation = selected.getComponent(Rotation);
                if (!rotation) {
                    return;
                }
                if (engine.input.mouseLeftDownThisFrame) {
                    quat.copy(this.dragStartRotation, rotation.value);
                    vec3.copy(this.dragNormal, engine.mouseNormal);
                    const matrix = selected.getWorldMatrix();
                    mat4.getTranslation(this.dragOrigin, matrix);
                    mat4.invert(this.invMatrix, matrix);
                    this.radius = this.cone.size;
                    vec3.transformMat4(_normal, vec3.set(_normal, 1, 0, 0), matrix);
                    this.reverse = vec3.dot(_normal, engine.mouseNormal) > 0;
                }
                if (engine.input.isKeyPressed('Alt')) {
                    vec3.set(_twistAxis, 1, 0, 0);
                    quat.setAxisAngle(_twist, _twistAxis, this.twistAngle);
                    const rotation: [number, number, number, number] = [0, 0, 0, 1];
                    quat.mul(rotation, this.dragStartRotation, _twist);
                    engine.onSetNodeValues([{node: selected, component: Rotation, value: rotation}]);
                    return;
                }
                const ray0 = this.reverse ? engine.mouseRay1 : engine.mouseRay0;
                const ray1 = this.reverse ? engine.mouseRay0 : engine.mouseRay1;
                if (!raycastSphere(
                    _draggingPoint,
                    ray0[0],
                    ray0[1],
                    ray0[2],
                    ray1[0],
                    ray1[1],
                    ray1[2],
                    this.dragOrigin[0],
                    this.dragOrigin[1],
                    this.dragOrigin[2],
                    this.radius
                )) {
                    raycastPlane(
                        _draggingPoint,
                        engine.mouseRay0[0],
                        engine.mouseRay0[1],
                        engine.mouseRay0[2],
                        engine.mouseRay1[0],
                        engine.mouseRay1[1],
                        engine.mouseRay1[2],
                        this.dragOrigin[0],
                        this.dragOrigin[1],
                        this.dragOrigin[2],
                        this.dragNormal[0],
                        this.dragNormal[1],
                        this.dragNormal[2],
                    );
                }
                vec3.transformMat4(_draggingPoint, _draggingPoint, this.invMatrix);
                if (engine.input.mouseLeftDownThisFrame) {
                    vec3.copy(this.dragStartLocalPoint, _draggingPoint);
                    return;
                }
                vec3.normalize(_draggingPoint, _draggingPoint);
                const result: [number, number, number, number] = [0, 0, 0, 1];
                quatFromTwoVec(_detRotation, this.dragStartLocalPoint, _draggingPoint);
                quat.mul(result, this.dragStartRotation, _detRotation);
                if (engine.input.isKeyPressed('Shift')) {
                    quatToEuler(_euler, result);
                    const det = Math.PI / 180 * 45;
                    _euler[0] = Math.round(_euler[0] / det) * det;
                    _euler[1] = Math.round(_euler[1] / det) * det;
                    _euler[2] = Math.round(_euler[2] / det) * det;
                    eulerToQuat(result, _euler[2], _euler[1], _euler[0]);
                }
                engine.onSetNodeValues([{node: selected, component: Rotation, value: result}]);
            }
                break;

            // ========================== translation ==========================
            case SkeletonObjectType.CURSOR_3D_MOVE_HANDLER: {
                const translation = selected.getComponent(Translation);
                if (!translation) {
                    return;
                }
                if (engine.input.mouseLeftDownThisFrame) {
                    vec3.copy(this.dragStartTranslation, translation.value);
                    vec3.copy(this.dragNormal, engine.mouseNormal);
                    mat4.getTranslation(this.dragOrigin, selected.getWorldMatrix());
                    mat4.invert(this.invMatrix, selected.getParentWorldMatrix());
                }
                raycastPlane(
                    _draggingPoint,
                    engine.mouseRay0[0],
                    engine.mouseRay0[1],
                    engine.mouseRay0[2],
                    engine.mouseRay1[0],
                    engine.mouseRay1[1],
                    engine.mouseRay1[2],
                    this.dragOrigin[0],
                    this.dragOrigin[1],
                    this.dragOrigin[2],
                    this.dragNormal[0],
                    this.dragNormal[1],
                    this.dragNormal[2],
                );
                vec3.transformMat4(_draggingPoint, _draggingPoint, this.invMatrix);
                if (engine.input.mouseLeftDownThisFrame) {
                    vec3.copy(this.dragStartLocalPoint, _draggingPoint);
                    return;
                }
                vec3.sub(_detTranslation, _draggingPoint, this.dragStartLocalPoint);
                const result: [number, number, number] = [0, 0, 0];
                vec3.add(result, this.dragStartTranslation, _detTranslation);
                if (engine.input.isKeyPressed('Shift')) {
                    const det = 0.5;
                    result[0] = Math.round(result[0] / det) * det;
                    result[1] = Math.round(result[1] / det) * det;
                    result[2] = Math.round(result[2] / det) * det;
                }
                engine.onSetNodeValues([{node: selected, component: Translation, value: result}]);
            }
                break;
        }
    }

}
