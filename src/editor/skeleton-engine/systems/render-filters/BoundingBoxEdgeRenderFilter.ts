import BoundingBoxEdgeGeometry from '../../components/BoundingBoxEdgeGeometry';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import Scale from '../../tools/Scale';
import {NodeRenderFilter} from '../NodesRenderSystem';

const ACTIVE_COLOR = [0, 1, 1, 1];
const INACTIVE_COLOR = [1, 1, 1, .6];
const SELECTED_COLOR = [1, 1, 1, 1];

export default class BoundingBoxEdgeRenderFilter extends NodeRenderFilter {

    begin(engine: SkeletonEngine): boolean {
        engine.renderer.useShader(engine.lineShader);
        engine.renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        engine.renderer.uniform('u_zBias', 0.0001);
        return true;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const boundingBoxEdgeGeometry = node.getComponent(BoundingBoxEdgeGeometry);
        if (boundingBoxEdgeGeometry) {
            let color: number[] = INACTIVE_COLOR;
            if (engine.tool === Scale.name && node.id === engine.draggingObjectId) {
                color = ACTIVE_COLOR;
            } else if (node === engine.selectedNode) {
                color = SELECTED_COLOR;
            }
            engine.renderer.uniform('u_color', color);
            engine.renderer.uniform('u_mMatrix', node.getWorldMatrix());
            engine.renderer.drawGeometry(boundingBoxEdgeGeometry.value);
        }
    }

    end(engine: SkeletonEngine): void {
    }

}