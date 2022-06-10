import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';

export default class PickingRenderSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.depthTest(true);
        renderer.cullFace(renderer.SIDE_BACK);
        renderer.blendMode(renderer.BLEND_MODE_OVERLAP);
        renderer.resizeFrameBufferTextures(engine.pickingFrameBuffer);
        renderer.startCapture(engine.pickingFrameBuffer);
        renderer.clearColor(0, 0, 0, 0);
        renderer.clear(true, true, false);
    }

    end(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.endCapture();
    }

}
