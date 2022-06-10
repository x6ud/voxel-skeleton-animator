import VoxelFaceGeometry from '../../components/VoxelFaceGeometry';
import DirectionalLight from '../../../utils/light/DirectionalLight';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {NodeRenderFilter} from '../NodesRenderSystem';

export default class PreviewLightRenderFilter extends NodeRenderFilter {

    private readonly light = new DirectionalLight(0, 0, 0, 1000);

    constructor() {
        super();
        this.light.position = [0, 500, 250];
    }

    begin(engine: SkeletonEngine): boolean {
        const canvas = engine.previewCanvas;
        if (!canvas) {
            return false;
        }
        const light = this.light;
        light.width = canvas.width * 4;
        light.height = canvas.height * 4;
        light.viewportWidth = canvas.width * 0.5;
        light.viewportHeight = canvas.height * 0.5;
        const renderer = engine.renderer;
        renderer.useShader(engine.fastShader);
        light.beginProjection(renderer);
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
        this.light.endProjection(engine.renderer);
        engine.texPreviewLightDepth = this.light.depthTexture;
        engine.matPreviewLight = this.light.textureMatrix;
    }

}
