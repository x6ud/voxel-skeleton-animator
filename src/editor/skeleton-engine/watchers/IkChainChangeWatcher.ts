import {mat4, vec3} from 'gl-matrix';
import {toRaw} from 'vue';
import Class from '../../../common/type/Class';
import EndEffector from '../components/EndEffector';
import InternalIkChain from '../components/InternalIkChain';
import Length from '../components/Length';
import MiddleEffector from '../components/MiddleEffector';
import PreventSpin from '../components/PreventSpin';
import Rotation from '../components/Rotation';
import Translation from '../components/Translation';
import TwistAngle from '../components/TwistAngle';
import UseWorldSpace from '../components/UseWorldSpace';
import IkChain from '../nodes/IkChain';
import IkChainNode from '../nodes/IkChainNode';
import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';
import SkeletonModelNodeChangeWatcher from '../SkeletonModelNodeChangeWatcher';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

const invWorldMatrix = mat4.create();

export default class IkChainChangeWatcher extends SkeletonModelNodeChangeWatcher {

    onComponentChanged(engine: SkeletonEngine, node: SkeletonModelNode, componentClass: Class<SkeletonModelNodeComponent<any>>): void {
        if (node.type === IkChain.name) {
            if (
                componentClass === MiddleEffector
                || componentClass === EndEffector
                || componentClass === PreventSpin
                || componentClass === UseWorldSpace
            ) {
                if (componentClass === UseWorldSpace) {
                    const middleEffector = node.getComponentAssert(MiddleEffector);
                    const endEffector = node.getComponentAssert(EndEffector);
                    const middleEffectorValue: [number, number, number] = [...middleEffector.value];
                    const endEffectorValue: [number, number, number] = [...endEffector.value];
                    const worldMatrix = node.getWorldMatrix();
                    if (node.getValue(UseWorldSpace)) {
                        vec3.transformMat4(middleEffectorValue, middleEffectorValue, worldMatrix);
                        vec3.transformMat4(endEffectorValue, endEffectorValue, worldMatrix);
                    } else {
                        mat4.invert(invWorldMatrix, worldMatrix);
                        vec3.transformMat4(middleEffectorValue, middleEffectorValue, invWorldMatrix);
                        vec3.transformMat4(endEffectorValue, endEffectorValue, invWorldMatrix);
                    }
                    middleEffector.value = middleEffectorValue;
                    endEffector.value = endEffectorValue;
                }
                node = toRaw(node);
                markIkChainAsDirty(node);
            }
        } else if (node.type === IkChainNode.name) {
            if (componentClass === Length) {
                node = toRaw(node);
                node.parent && markIkChainAsDirty(node.parent);
            }
        }
        if (componentClass === Translation || componentClass === Rotation || componentClass === TwistAngle) {
            node = toRaw(node);
            for (let child of node.children) {
                markIkChainAsDirty(child);
            }
        }
    }

    onMoved(engine: SkeletonEngine, oldParent: SkeletonModelNode | null, newParent: SkeletonModelNode | null, node: SkeletonModelNode): void {
        if (oldParent?.type === IkChain.name) {
            markIkChainAsDirty(oldParent);
        }
        if (newParent?.type === IkChain.name && oldParent !== newParent) {
            markIkChainAsDirty(newParent);
        }
    }

    onChildAdded(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void {
        if (node.type === IkChain.name) {
            markIkChainAsDirty(node);
        }
    }

    onChildRemoved(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void {
        if (node.type === IkChain.name) {
            markIkChainAsDirty(node);
        }
    }

}

function markIkChainAsDirty(node: SkeletonModelNode) {
    const internalIkChain = node.getComponent(InternalIkChain);
    if (internalIkChain) {
        internalIkChain.dirty = true;
    }
    for (let child of node.children) {
        markIkChainAsDirty(child);
    }
}