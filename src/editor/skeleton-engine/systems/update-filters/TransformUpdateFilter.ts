import {mat4, ReadonlyMat4, ReadonlyVec3} from 'gl-matrix';
import IkNodeRotation from '../../components/IkNodeRotation';
import IkNodeTranslation from '../../components/IkNodeTranslation';
import LocalMatrix from '../../components/LocalMatrix';
import Rotation from '../../components/Rotation';
import Translation from '../../components/Translation';
import TwistAngle from '../../components/TwistAngle';
import WorldMatrix from '../../components/WorldMatrix';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {NodeUpdateFilter} from '../NodesUpdateSystem';

const defaultTranslation: [number, number, number] = [0, 0, 0];
const defaultRotation: [number, number, number, number] = [0, 0, 0, 1];
const UNIT_MAT4 = mat4.create();
mat4.identity(UNIT_MAT4);
const TWIST_AXIS: ReadonlyVec3 = [1, 0, 0];
const twistMat = mat4.create();

export default class TransformUpdateFilter extends NodeUpdateFilter {

    update(engine: SkeletonEngine, node: SkeletonModelNode): void {
        this.getLocalMatrix(node);
        this.getWorldMatrix(node);
    }

    private getLocalMatrix(node: SkeletonModelNode): ReadonlyMat4 {
        const localMatrix = node.getComponent(LocalMatrix);
        if (localMatrix) {
            if (localMatrix.dirty) {
                const translation = node.getValueOrElse(Translation, node.getValueOrElse(IkNodeTranslation, defaultTranslation));
                const rotation = node.getValueOrElse(Rotation, node.getValueOrElse(IkNodeRotation, defaultRotation));
                const twistAngle = node.getValueOrElse(TwistAngle, 0);
                mat4.fromRotation(twistMat, twistAngle, TWIST_AXIS);
                mat4.fromRotationTranslation(localMatrix.value, rotation, translation);
                mat4.mul(localMatrix.value, localMatrix.value, twistMat);
                localMatrix.dirty = false;
            }
            return localMatrix.value;
        }
        return UNIT_MAT4;
    }

    private getWorldMatrix(node: SkeletonModelNode): ReadonlyMat4 {
        const worldMatrix = node.getComponent(WorldMatrix);
        if (worldMatrix) {
            if (worldMatrix.dirty) {
                const localMatrix = this.getLocalMatrix(node);
                if (node.parent) {
                    mat4.multiply(worldMatrix.value, this.getWorldMatrix(node.parent), localMatrix);
                } else {
                    mat4.copy(worldMatrix.value, localMatrix);
                }
                worldMatrix.dirty = false;
            }
            return worldMatrix.value;
        }
        if (node.parent) {
            return this.getWorldMatrix(node.parent);
        }
        return UNIT_MAT4;
    }

}