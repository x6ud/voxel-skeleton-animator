import Class from '../../common/type/Class';
import SkeletonEngine from './SkeletonEngine';
import SkeletonModelNode from './SkeletonModelNode';
import SkeletonModelNodeComponent from './SkeletonModelNodeComponent';

export default abstract class SkeletonModelNodeChangeWatcher {

    abstract onComponentChanged(engine: SkeletonEngine, node: SkeletonModelNode, componentClass: Class<SkeletonModelNodeComponent<any>>): void;

    abstract onMoved(engine: SkeletonEngine,
                     oldParent: SkeletonModelNode | null,
                     newParent: SkeletonModelNode | null,
                     node: SkeletonModelNode
    ): void;

    abstract onChildAdded(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void;

    abstract onChildRemoved(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void;

}