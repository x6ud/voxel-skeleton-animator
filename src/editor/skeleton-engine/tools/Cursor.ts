import {mat4, ReadonlyMat4, ReadonlyVec2, ReadonlyVec3, vec2, vec3} from 'gl-matrix';
import Class from '../../../common/type/Class';
import {raycastPlane} from '../../utils/geometry/raycast';
import EndEffector from '../components/EndEffector';
import Height from '../components/Height';
import MiddleEffector from '../components/MiddleEffector';
import MiddleEffectorHandler from '../components/MiddleEffectorHandler';
import Translation from '../components/Translation';
import TwistAngle from '../components/TwistAngle';
import UseWorldSpace from '../components/UseWorldSpace';
import Width from '../components/Width';
import IkChain from '../nodes/IkChain';
import IkChainNode from '../nodes/IkChainNode';
import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';
import {SkeletonObjectType} from '../SkeletonObjectType';
import icon from './cursor.png';
import SkeletonEngineTool from './SkeletonEngineTool';

const targetPoint = vec3.create();
const draggingPoint = vec3.create();
const det = vec3.create();

const TWIST_AXIS: ReadonlyVec3 = [1, 0, 0];
const twistAxisStart = vec3.create();
const twistAxisEnd = vec3.create();
const normal2d = vec2.create();

const middleEffector = vec3.create();

export default class Cursor extends SkeletonEngineTool {

    name = Cursor.name;
    label = 'Cursor';
    icon = icon;

    private dragNormal = vec3.create();
    private dragOrigin = vec3.create();
    private invMatrix = mat4.create();
    private dragStartLocalPoint = vec3.create();
    private dragStartTargetValue = vec3.create();
    private dragStartTwistAngle = 0;
    private dragStartTwistAngleDet = 0;

    onPreSolve(engine: SkeletonEngine): void {
    }

    onRender(engine: SkeletonEngine): void {
    }

    onRenderPicking(engine: SkeletonEngine): void {
    }

    onPostSolve(engine: SkeletonEngine): void {
        if (engine.draggingObjectId === 0) {
            return;
        }
        switch (engine.draggingObjectType) {
            case SkeletonObjectType.VOXEL: {
                const node = engine.getNode(engine.draggingObjectId, engine.activeModel);
                switch (node.type) {
                    case IkChainNode.name: {
                        // if (!this.handleLimbIkChainMiddleEffector(engine, node)) {
                        //     this.handleTwistAngleMouseDrag(engine, node);
                        // }
                        this.handleTwistAngleMouseDrag(engine, node);
                    }
                        break;
                }
            }
                break;
            // case SkeletonObjectType.IK_CHAIN_LIMB_MIDDLE_EFFECTOR: {
            //     const node = engine.getNode(engine.draggingObjectId, engine.activeModel);
            //     this.handleLimbIkChainMiddleEffector(engine, node);
            // }
            //     break;
            case SkeletonObjectType.IK_CHAIN_TRANSLATION: {
                const node = engine.getNode(engine.draggingObjectId, engine.activeModel);
                mat4.getTranslation(targetPoint, node.getWorldMatrix());
                this.handleViewPlaneMouseDrag(engine, node, targetPoint, node.getParentWorldMatrix(), false, Translation);
            }
                break;
            case SkeletonObjectType.IK_CHAIN_MIDDLE_EFFECTOR: {
                const node = engine.getNode(engine.draggingObjectId, engine.activeModel);
                vec3.transformMat4(targetPoint, node.getValue(MiddleEffector), node.getWorldMatrix());
                this.handleViewPlaneMouseDrag(engine, node, targetPoint, node.getWorldMatrix(), node.getValueOrElse(UseWorldSpace, false), MiddleEffector);
            }
                break;
            case SkeletonObjectType.IK_CHAIN_END_EFFECTOR: {
                const node = engine.getNode(engine.draggingObjectId, engine.activeModel);
                vec3.transformMat4(targetPoint, node.getValue(EndEffector), node.getWorldMatrix());
                this.handleViewPlaneMouseDrag(engine, node, targetPoint, node.getWorldMatrix(), node.getValueOrElse(UseWorldSpace, false), EndEffector);
            }
                break;
        }
    }

    private handleLimbIkChainMiddleEffector(engine: SkeletonEngine, node: SkeletonModelNode): boolean {
        if (!engine.input.mouseLeft) {
            return false;
        }
        const chain = node.parent;
        if (chain?.type !== IkChain.name) {
            return false;
        }
        if (chain.children.length !== 2) {
            return false;
        }
        if (chain.getValue(MiddleEffectorHandler)) {
            return false;
        }

        if (engine.input.mouseLeftDownThisFrame) {
            mat4.getTranslation(middleEffector, chain.children[1].getWorldMatrix());
            vec3.transformMat4(middleEffector, middleEffector, engine.camera.pvMatrix);
            const radius = 600 / vec3.distance(middleEffector, engine.camera.position) * Math.min(
                chain.children[0].getValue(Width),
                chain.children[0].getValue(Height),
                chain.children[1].getValue(Width),
                chain.children[1].getValue(Height),
            );
            const renderer = engine.renderer;
            const cx = middleEffector[0] * renderer.state.width / 2;
            const cy = middleEffector[1] * renderer.state.height / 2;
            const mx = engine.mouseNormalized[0] * renderer.state.width / 2;
            const my = engine.mouseNormalized[1] * renderer.state.height / 2;
            if (Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2) > radius) {
                return false;
            }
            engine.draggingObjectType = SkeletonObjectType.IK_CHAIN_LIMB_MIDDLE_EFFECTOR;
            mat4.invert(this.invMatrix, chain.getWorldMatrix());
        }
        if (engine.draggingObjectType !== SkeletonObjectType.IK_CHAIN_LIMB_MIDDLE_EFFECTOR) {
            return false;
        }

        mat4.getTranslation(middleEffector, chain.children[1].getWorldMatrix());

        if (engine.input.mouseLeftDownThisFrame) {
            vec3.copy(this.dragOrigin, middleEffector);
            vec3.copy(this.dragNormal, engine.mouseNormal);
        }

        if (engine.input.mouseLeft) {
            raycastPlane(
                draggingPoint,
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
            vec3.transformMat4(draggingPoint, draggingPoint, this.invMatrix);

            engine.onSetNodeValues([
                {
                    node: chain,
                    component: MiddleEffector,
                    value: [draggingPoint[0], draggingPoint[1], draggingPoint[2]]
                }
            ]);
        }

        return true;
    }

    private handleTwistAngleMouseDrag(engine: SkeletonEngine, node: SkeletonModelNode) {
        const mat = node.getWorldMatrix();
        mat4.getTranslation(twistAxisStart, mat);
        vec3.transformMat4(twistAxisEnd, TWIST_AXIS, mat);
        vec3.transformMat4(twistAxisStart, twistAxisStart, engine.camera.pvMatrix);
        vec3.transformMat4(twistAxisEnd, twistAxisEnd, engine.camera.pvMatrix);
        vec2.sub(normal2d, twistAxisEnd as ReadonlyVec2, twistAxisStart as ReadonlyVec2);
        const x = normal2d[0];
        const y = normal2d[1];
        vec2.set(normal2d, -y, x);
        vec2.normalize(normal2d, normal2d);
        const p1 = vec2.dot(normal2d, engine.mouseNormalized as ReadonlyVec2);
        const p0 = vec2.dot(normal2d, twistAxisStart as ReadonlyVec2);
        let det = p1 - p0;
        if (engine.input.mouseLeftDownThisFrame) {
            this.dragStartTwistAngle = node.getValue(TwistAngle);
            this.dragStartTwistAngleDet = det;
            return;
        }
        det -= this.dragStartTwistAngleDet;
        det *= Math.PI;
        let value = this.dragStartTwistAngle - det;
        if (engine.input.isKeyPressed('Shift')) {
            const det = Math.PI / 4;
            value = Math.round(value / det) * det;
        }
        engine.onSetNodeValues([{node, component: TwistAngle, value}])
    }

    private handleViewPlaneMouseDrag(
        engine: SkeletonEngine,
        node: SkeletonModelNode,
        point: ReadonlyVec3,
        worldMatrix: ReadonlyMat4,
        useWorldSpace: boolean,
        componentClass: Class<SkeletonModelNodeComponent<[number, number, number]>>,
    ) {
        if (engine.input.mouseLeftDownThisFrame) {
            vec3.copy(this.dragNormal, engine.mouseNormal);
            vec3.copy(this.dragOrigin, point);
            mat4.invert(this.invMatrix, worldMatrix);
            vec3.copy(this.dragStartTargetValue, node.getValue(componentClass));
        }
        raycastPlane(
            draggingPoint,
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
        if (!useWorldSpace) {
            vec3.transformMat4(draggingPoint, draggingPoint, this.invMatrix);
        }
        if (engine.input.mouseLeftDownThisFrame) {
            vec3.copy(this.dragStartLocalPoint, draggingPoint);
            return;
        }
        vec3.sub(det, draggingPoint, this.dragStartLocalPoint);
        const result: [number, number, number] = [0, 0, 0];
        vec3.add(result, this.dragStartTargetValue, det);
        if (engine.input.isKeyPressed('Shift')) {
            const det = 0.5;
            result[0] = Math.round(result[0] / det) * det;
            result[1] = Math.round(result[1] / det) * det;
            result[2] = Math.round(result[2] / det) * det;
        }
        engine.onSetNodeValues([{node, component: componentClass, value: result}]);
    }

}
