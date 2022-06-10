import {setBufferVec4FromNum} from '../../../utils/buffer';
import VoxelFaceGeometry from '../../components/VoxelFaceGeometry';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {SkeletonObjectType} from '../../SkeletonObjectType';
import VoxelBox from '../../tools/VoxelBox';
import VoxelBrush from '../../tools/VoxelBrush';
import VoxelBucket from '../../tools/VoxelBucket';
import VoxelMove from '../../tools/VoxelMove';
import VoxelPen from '../../tools/VoxelPen';
import VoxelRangeBrush from '../../tools/VoxelRangeBrush';
import {NodeRenderFilter} from '../NodesRenderSystem';

const vecType = new Float32Array(4);
const vecId = new Float32Array(4);

const voxelTools = [VoxelPen.name, VoxelBox.name, VoxelBrush.name, VoxelRangeBrush.name, VoxelBucket.name, VoxelMove.name];

export default class VoxelPickingRenderFilter extends NodeRenderFilter {

    private highlightSelected = false;

    begin(engine: SkeletonEngine): boolean {
        this.highlightSelected = voxelTools.includes(engine.tool) && !!engine.selectedNode;

        engine.renderer.useShader(engine.pickingShader);
        engine.renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        setBufferVec4FromNum(vecType, 0, SkeletonObjectType.VOXEL);
        engine.renderer.uniform('u_type', vecType);
        engine.renderer.clear(false, true, false);
        return true;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const voxelFace = node.getComponent(VoxelFaceGeometry);
        if (voxelFace) {
            if (this.highlightSelected && node !== engine.selectedNode) {
                return;
            }
            engine.renderer.uniform('u_mMatrix', node.getWorldMatrix());
            setBufferVec4FromNum(vecId, 0, node.id);
            engine.renderer.uniform('u_id', vecId);
            engine.renderer.drawGeometry(voxelFace.value);
        }
    }

    end(engine: SkeletonEngine): void {
    }

}