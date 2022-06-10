import Class from '../../../common/type/Class';
import VoxelData from '../components/VoxelData';
import VoxelEdgeGeometry from '../components/VoxelEdgeGeometry';
import VoxelFaceGeometry from '../components/VoxelFaceGeometry';
import Width from '../components/Width';
import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';
import SkeletonModelNodeChangeWatcher from '../SkeletonModelNodeChangeWatcher';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

export default class VoxelChangeWatcher extends SkeletonModelNodeChangeWatcher {

    onComponentChanged(engine: SkeletonEngine, node: SkeletonModelNode, componentClass: Class<SkeletonModelNodeComponent<any>>): void {
        if (componentClass === VoxelData || componentClass === Width) {
            const face = node.getComponent(VoxelFaceGeometry);
            if (face) {
                face.dirty = true;
            }
            const edge = node.getComponent(VoxelEdgeGeometry);
            if (edge) {
                edge.dirty = true;
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