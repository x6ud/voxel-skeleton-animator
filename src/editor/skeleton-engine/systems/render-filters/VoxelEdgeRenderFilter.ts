import VoxelEdgeGeometry from '../../components/VoxelEdgeGeometry';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {NodeRenderFilter} from '../NodesRenderSystem';

const WHITE = [1, 1, 1, 1];

export default class VoxelEdgeRenderFilter extends NodeRenderFilter {

    begin(engine: SkeletonEngine): boolean {
        engine.renderer.useShader(engine.lineShader);
        engine.renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        engine.renderer.uniform('u_zBias', 0.0001);
        engine.renderer.uniform('u_color', WHITE);
        return true;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const voxelEdge = node.getComponent(VoxelEdgeGeometry);
        if (voxelEdge) {
            engine.renderer.uniform('u_mMatrix', node.getWorldMatrix());
            engine.renderer.drawGeometry(voxelEdge.value);
        }
    }

    end(engine: SkeletonEngine): void {
    }

}