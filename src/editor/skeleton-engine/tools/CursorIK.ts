import {mat4, quat, vec3} from 'gl-matrix';
import Texture from '../../../common/render/Texture';
import {setBufferVec4FromNum} from '../../utils/buffer';
import {drawArc} from '../../utils/draw-shape';
import LimbIk from '../../utils/ik/LimbIk';
import {quatFromVec} from '../../utils/geometry/math';
import {raycastPlane} from '../../utils/geometry/raycast';
import Length from '../components/Length';
import Rotation from '../components/Rotation';
import Translation from '../components/Translation';
import Cone from '../../utils/meshes/Cone';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import imgHandler from './cursor-ik-handler.png';
import imgMask from './cursor-ik-mask.png';
import icon from './cursor-ik.png';
import SkeletonEngineTool from './SkeletonEngineTool';

const CONE_COLOR = [.95, .95, .95, .75];
const TWIST_INDICATOR_RADIUS = 42;

const _vecType = new Float32Array(4);
const _vecId = new Float32Array(4);
const _pos1 = vec3.create();
const _pos2 = vec3.create();
const _normal1 = vec3.create();
const _rotate1 = quat.create();
const _rotate2 = quat.create();
const _draggingPoint = vec3.create();
const _detTranslation = vec3.create();
const _target = vec3.create();
const _invMat = mat4.create();
const _detRotation = quat.create();

const limbIk = new LimbIk();

export default class CursorIK extends SkeletonEngineTool {

    name = CursorIK.name;
    label = 'Cursor IK';
    icon = icon;

    private handlerVisible = false;
    private cone1 = new Cone();
    private cone2 = new Cone();
    private texHandler?: Texture;
    private texMask?: Texture;
    private end = vec3.create();
    private endScreen = vec3.create();
    private len1 = 0;
    private len2 = 0;
    private dragStartEnd2 = vec3.create();
    private dragStartEnd1 = vec3.create();
    private dragStartOrigin = vec3.create();
    private dragStartPoint = vec3.create();
    private dragNormal = vec3.create();
    private bone1ParentMatrix = mat4.create();
    private bone1Translation = vec3.create();
    private bone1Rotation = quat.create();
    private bone2Translation = vec3.create();
    private bone2Rotation = quat.create();
    private twistAxis = vec3.create();
    private twistAngle = 0;

    onPreSolve(engine: SkeletonEngine): void {
        this.handlerVisible = false;
        const bone2 = engine.selectedNode;
        if (!bone2) {
            return;
        }
        const bone1 = bone2.parent;
        if (!bone1) {
            return;
        }
        const rotation2 = bone2.getComponent(Rotation);
        if (!rotation2) {
            return;
        }
        const rotation1 = bone1.getComponent(Rotation);
        if (!rotation1) {
            return;
        }
        const mat2 = bone2.getWorldMatrix();
        const mat1 = bone1.getWorldMatrix();
        mat4.getTranslation(_pos2, mat2);
        mat4.getTranslation(_pos1, mat1);
        vec3.sub(_normal1, _pos2, _pos1);
        const len1 = vec3.length(_normal1);
        if (len1 < 1e-8) {
            return;
        }
        const len2 = bone2.getValueOrElse(Length, 1);
        this.cone1.size = len1;
        this.cone2.size = len2;
        this.cone1.position = _pos1;
        this.cone2.position = _pos2;
        this.cone1.quaternion = quatFromVec(_rotate1, _normal1);
        this.cone2.quaternion = mat4.getRotation(_rotate2, mat2);
        vec3.set(this.end, len2, 0, 0);
        vec3.transformMat4(this.end, this.end, mat2);
        vec3.transformMat4(this.endScreen, this.end, engine.camera.pvMatrix);
        this.handlerVisible = true;

        const renderer = engine.renderer;
        if (!this.texHandler) {
            this.texHandler = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgHandler).then(texture => this.texHandler = texture);
        }
        if (!this.texMask) {
            this.texMask = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgMask).then(texture => this.texMask = texture);
        }

        if (
            engine.draggingObjectType === SkeletonObjectType.CURSOR_IK_HANDLER
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
        this.cone1.render(renderer);
        this.cone2.render(renderer);
        if (this.texHandler) {
            renderer.begin2D();
            renderer.useShader();
            const cx = this.endScreen[0] * renderer.state.width / 2;
            const cy = this.endScreen[1] * renderer.state.height / 2;
            renderer.draw(
                this.texHandler,
                cx - this.texHandler.width / 2,
                cy - this.texHandler.height / 2,
            );
            if (
                engine.draggingObjectType === SkeletonObjectType.CURSOR_IK_HANDLER
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
        if (this.texMask) {
            renderer.begin2D();
            renderer.useShader(engine.picking2dShader);
            setBufferVec4FromNum(_vecId, 0, engine.selectedNode?.id || 0);
            renderer.uniform('u_id', _vecId);
            setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.CURSOR_IK_HANDLER);
            renderer.uniform('u_type', _vecType);
            renderer.draw(
                this.texMask,
                this.endScreen[0] * renderer.state.width / 2 - this.texMask.width / 2,
                this.endScreen[1] * renderer.state.height / 2 - this.texMask.height / 2,
            );
            renderer.end2D();
        }
    }

    onPostSolve(engine: SkeletonEngine): void {
        const bone2 = engine.selectedNode;
        if (!bone2) {
            return;
        }
        const bone1 = bone2.parent;
        if (!bone1) {
            return;
        }
        if (engine.draggingObjectType === SkeletonObjectType.NONE) {
            if (engine.input.isKeyPressed('r')) {
                engine.onSetNodeValues([
                    {node: bone1, component: Rotation, value: [0, 0, 0, 1]},
                    {node: bone2, component: Rotation, value: [0, 0, 0, 1]},
                ]);
            }
            return;
        }
        if (engine.draggingObjectType !== SkeletonObjectType.CURSOR_IK_HANDLER) {
            return;
        }
        if (engine.input.mouseLeftDownThisFrame) {
            this.len1 = this.cone1.size;
            this.len2 = this.cone2.size;
            vec3.copy(this.dragStartOrigin, this.cone1.position);
            vec3.copy(this.dragStartEnd1, this.cone2.position);
            vec3.copy(this.dragStartEnd2, this.end);

            vec3.copy(this.dragNormal, engine.mouseNormal);
            raycastPlane(
                this.dragStartPoint,
                engine.mouseRay0[0],
                engine.mouseRay0[1],
                engine.mouseRay0[2],
                engine.mouseRay1[0],
                engine.mouseRay1[1],
                engine.mouseRay1[2],
                this.dragStartEnd2[0],
                this.dragStartEnd2[1],
                this.dragStartEnd2[2],
                this.dragNormal[0],
                this.dragNormal[1],
                this.dragNormal[2],
            );

            mat4.copy(this.bone1ParentMatrix, bone1.getParentWorldMatrix());
            vec3.copy(this.bone1Translation, bone1.getValue(Translation));
            quat.copy(this.bone1Rotation, bone1.getValue(Rotation));
            vec3.copy(this.bone2Translation, bone2.getValue(Translation));
            quat.copy(this.bone2Rotation, bone2.getValue(Rotation));

            mat4.invert(_invMat, bone1.getWorldMatrix());
            vec3.transformMat4(this.twistAxis, this.dragStartEnd2, _invMat);
            vec3.normalize(this.twistAxis, this.twistAxis);
            return;
        }
        if (engine.input.isKeyPressed('Alt')) {
            quat.setAxisAngle(_detRotation, this.twistAxis, this.twistAngle);
            quat.normalize(_detRotation, _detRotation);
            const rotation1: [number, number, number, number] = [0, 0, 0, 1];
            quat.mul(rotation1, this.bone1Rotation, _detRotation);
            engine.onSetNodeValues([
                {node: bone1, component: Rotation, value: rotation1},
                {node: bone2, component: Rotation, value: [...this.bone2Rotation]},
            ]);
            return;
        }
        raycastPlane(
            _draggingPoint,
            engine.mouseRay0[0],
            engine.mouseRay0[1],
            engine.mouseRay0[2],
            engine.mouseRay1[0],
            engine.mouseRay1[1],
            engine.mouseRay1[2],
            this.dragStartEnd2[0],
            this.dragStartEnd2[1],
            this.dragStartEnd2[2],
            this.dragNormal[0],
            this.dragNormal[1],
            this.dragNormal[2],
        );
        vec3.sub(_detTranslation, _draggingPoint, this.dragStartPoint);
        vec3.add(_target, this.dragStartEnd2, _detTranslation);
        if (engine.input.isKeyPressed('Shift')) {
            const det = 0.5;
            _target[0] = Math.round(_target[0] / det) * det;
            _target[1] = Math.round(_target[1] / det) * det;
            _target[2] = Math.round(_target[2] / det) * det;
        }

        mat4.copy(limbIk.matrix, this.bone1ParentMatrix);
        vec3.copy(limbIk.localTranslation1, this.bone1Translation);
        quat.copy(limbIk.localRotation1, this.bone1Rotation);
        limbIk.length1 = this.len1;
        vec3.copy(limbIk.localTranslation2, this.bone2Translation);
        quat.copy(limbIk.localRotation2, this.bone2Rotation);
        limbIk.length2 = this.len2;
        limbIk.resolve(_target);

        const rotation1: [number, number, number, number] = [0, 0, 0, 1];
        quat.copy(rotation1, limbIk.localRotation1);
        const rotation2: [number, number, number, number] = [0, 0, 0, 1];
        quat.copy(rotation2, limbIk.localRotation2);
        engine.onSetNodeValues([
            {node: bone1, component: Rotation, value: rotation1},
            {node: bone2, component: Rotation, value: rotation2},
        ]);
    }

}
