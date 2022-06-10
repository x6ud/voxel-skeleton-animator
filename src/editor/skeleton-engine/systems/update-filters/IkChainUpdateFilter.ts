import {mat4, ReadonlyVec3, vec3} from 'gl-matrix';
import {toRaw} from 'vue';
import FabrikJoint from '../../../utils/ik/FabrikJoint';
import {getVerticalInDir, isVec3Zero, quatFromRightUp} from '../../../utils/geometry/math';
import EndEffector from '../../components/EndEffector';
import IkNodeRotation from '../../components/IkNodeRotation';
import IkNodeTranslation from '../../components/IkNodeTranslation';
import InternalIkChain from '../../components/InternalIkChain';
import Length from '../../components/Length';
import MiddleEffector from '../../components/MiddleEffector';
import PreventSpin from '../../components/PreventSpin';
import UseWorldSpace from '../../components/UseWorldSpace';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {NodeUpdateFilter} from '../NodesUpdateSystem';

const ORIGIN: ReadonlyVec3 = [0, 0, 0];
const RIGHT: ReadonlyVec3 = [1, 0, 0];
const right = vec3.create();
const up = vec3.create();
const middleEffector = vec3.create();
const endEffector = vec3.create();
const invWorldMatrix = mat4.create();

export default class IkChainUpdateFilter extends NodeUpdateFilter {

    update(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const internalIkChain = node.getComponent(InternalIkChain);
        if (!internalIkChain) {
            return;
        }
        if (!internalIkChain.dirty) {
            return;
        }
        internalIkChain.dirty = false;

        const ikChain = toRaw(internalIkChain.value);
        const len = node.children.length;
        while (ikChain.joints.length > len) {
            ikChain.joints.pop();
        }
        while (ikChain.joints.length < len) {
            ikChain.joints.push(new FabrikJoint());
        }
        for (let i = 0; i < len; ++i) {
            ikChain.joints[i].length = node.children[i].getValue(Length);
        }

        vec3.copy(middleEffector, node.getValue(MiddleEffector));
        vec3.copy(endEffector, node.getValue(EndEffector));
        if (node.getValueOrElse(UseWorldSpace, false)) {
            mat4.invert(invWorldMatrix, node.getWorldMatrix());
            vec3.transformMat4(middleEffector, middleEffector, invWorldMatrix);
            vec3.transformMat4(endEffector, endEffector, invWorldMatrix);
        }

        ikChain.resolve(middleEffector, endEffector);
        const preventSpin = node.getValue(PreventSpin);
        for (let i = 0; i < len; ++i) {
            const child = node.children[i];
            const joint = ikChain.joints[i];
            engine.setData(child, IkNodeTranslation, [joint.start[0], joint.start[1], joint.start[2]]);
            const rotation: [number, number, number, number] = [joint.rotation[0], joint.rotation[1], joint.rotation[2], joint.rotation[3]];
            if (preventSpin) {
                vec3.transformQuat(right, RIGHT, rotation);
                vec3.set(up, right[0], right[1], 0);
                vec3.normalize(up, up);
                if (isVec3Zero(up)) {
                    vec3.set(up, 1, 0, 0);
                }
                vec3.rotateZ(up, up, ORIGIN, -Math.PI / 2);
                getVerticalInDir(up, right, up);
                quatFromRightUp(rotation, right, up);
            }
            engine.setData(child, IkNodeRotation, rotation);
        }
        if (len === 1) {
            const endEffector = node.getComponentAssert(EndEffector);
            vec3.copy(endEffector.value, ikChain.joints[0].end);
        }
    }

}
