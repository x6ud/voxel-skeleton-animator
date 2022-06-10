import {toRaw} from 'vue';
import Class from '../../../common/type/Class';
import IkNodeRotation from '../components/IkNodeRotation';
import IkNodeTranslation from '../components/IkNodeTranslation';
import LocalMatrix from '../components/LocalMatrix';
import Rotation from '../components/Rotation';
import Translation from '../components/Translation';
import TwistAngle from '../components/TwistAngle';
import WorldMatrix from '../components/WorldMatrix';
import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';
import SkeletonModelNodeChangeWatcher from '../SkeletonModelNodeChangeWatcher';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

const watch = [Translation, Rotation, TwistAngle, IkNodeTranslation, IkNodeRotation];

export default class TransformChangeWatcher extends SkeletonModelNodeChangeWatcher {

    onComponentChanged(engine: SkeletonEngine, node: SkeletonModelNode, componentClass: Class<SkeletonModelNodeComponent<any>>): void {
        node = toRaw(node);
        if (watch.includes(componentClass)) {
            const localMatrix = node.getComponent(LocalMatrix);
            if (localMatrix) {
                localMatrix.dirty = true;
            }
            const stack: SkeletonModelNode[] = [];
            stack.push(node);
            for (; ;) {
                const node = stack.pop();
                if (!node) {
                    break;
                }
                const worldMatrix = node.getComponent(WorldMatrix);
                if (worldMatrix) {
                    worldMatrix.dirty = true;
                }
                stack.push(...node.children);
            }
        }
    }

    onMoved(engine: SkeletonEngine, oldParent: SkeletonModelNode | null, newParent: SkeletonModelNode | null, node: SkeletonModelNode): void {
        const stack: SkeletonModelNode[] = [];
        stack.push(node);
        for (; ;) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            const worldMatrix = node.getComponent(WorldMatrix);
            if (worldMatrix) {
                worldMatrix.dirty = true;
            }
            stack.push(...node.children);
        }
    }

    onChildAdded(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void {
    }

    onChildRemoved(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void {
    }

}