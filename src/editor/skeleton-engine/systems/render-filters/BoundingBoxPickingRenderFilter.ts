import BoundingBoxPickingGeometry from '../../components/BoundingBoxPickingGeometry';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import VoxelBox from '../../tools/VoxelBox';
import VoxelPen from '../../tools/VoxelPen';
import VoxelRangeBrush from '../../tools/VoxelRangeBrush';
import {NodeRenderFilter} from '../NodesRenderSystem';

const match = [VoxelPen.name, VoxelBox.name, VoxelRangeBrush.name];

export default class BoundingBoxPickingRenderFilter extends NodeRenderFilter {

    begin(engine: SkeletonEngine): boolean {
        if (match.includes(engine.tool)) {
            const renderer = engine.renderer;
            renderer.cullFace(renderer.SIDE_FRONT);
            renderer.useShader(engine.pickingMeshShader);
            renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
            return true;
        }
        return false;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        if (node.id !== engine.selectedNode?.id) {
            return;
        }
        const pickingGeometry = node.getComponent(BoundingBoxPickingGeometry);
        if (pickingGeometry) {
            engine.renderer.uniform('u_mMatrix', node.getWorldMatrix());
            engine.renderer.drawGeometry(pickingGeometry.value);
        }
    }

    end(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.cullFace(renderer.SIDE_BACK);
    }

}