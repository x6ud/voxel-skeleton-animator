import VoxelFaceGeometry from '../../components/VoxelFaceGeometry';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {NodeRenderFilter} from '../NodesRenderSystem';

export default class PreviewVoxelRenderFilter extends NodeRenderFilter {

    begin(engine: SkeletonEngine): boolean {
        if (!engine.texPreviewLightDepth || !engine.matPreviewLight) {
            return false;
        }
        engine.renderer.useShader(engine.shadowMappingShader);
        engine.renderer.uniform('u_pvMatrix', engine.previewCamera.pvMatrix);
        engine.renderer.uniform('u_mMatrix2', engine.previewTransform);
        engine.renderer.uniform('u_projectedTexture', engine.texPreviewLightDepth);
        engine.renderer.uniform('u_projectionTextureMatrix', engine.matPreviewLight);
        return true;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const voxelFace = node.getComponent(VoxelFaceGeometry);
        if (voxelFace) {
            engine.renderer.uniform('u_mMatrix', node.getWorldMatrix());
            engine.renderer.drawGeometry(voxelFace.value);
        }
    }

    end(engine: SkeletonEngine): void {
    }

}
