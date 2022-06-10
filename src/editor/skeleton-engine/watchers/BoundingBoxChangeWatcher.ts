import Class from '../../../common/type/Class';
import BoundingBoxEdgeGeometry from '../components/BoundingBoxEdgeGeometry';
import BoundingBoxPickingGeometry from '../components/BoundingBoxPickingGeometry';
import Height from '../components/Height';
import Length from '../components/Length';
import Width from '../components/Width';
import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';
import SkeletonModelNodeChangeWatcher from '../SkeletonModelNodeChangeWatcher';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

const watch = [Width, Height, Length];

export default class BoundingBoxChangeWatcher extends SkeletonModelNodeChangeWatcher {

    onComponentChanged(engine: SkeletonEngine, node: SkeletonModelNode, componentClass: Class<SkeletonModelNodeComponent<any>>): void {
        if (watch.includes(componentClass)) {
            const boundingBoxEdgeGeometry = node.getComponent(BoundingBoxEdgeGeometry);
            if (boundingBoxEdgeGeometry) {
                boundingBoxEdgeGeometry.dirty = true;
            }
            const boundingBoxPickingGeometry = node.getComponent(BoundingBoxPickingGeometry);
            if (boundingBoxPickingGeometry) {
                boundingBoxPickingGeometry.dirty = true;
            }
        }
    }

    onMoved(engine: SkeletonEngine, oldParent: SkeletonModelNode | null, newParent: SkeletonModelNode | null, node: SkeletonModelNode): void {
    }

    onChildAdded(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void {
    }

    onChildRemoved(engine: SkeletonEngine, node: SkeletonModelNode, child: SkeletonModelNode): void {
    }

}