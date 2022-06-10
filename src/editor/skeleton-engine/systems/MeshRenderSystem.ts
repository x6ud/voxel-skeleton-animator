import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';

export default class MeshRenderSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.depthTest(true);
        renderer.cullFace(renderer.SIDE_BACK);
        renderer.blendMode(renderer.BLEND_MODE_PIGMENT);
        renderer.resizeFrameBufferTextures(engine.meshFrameBuffer);
        renderer.startCapture(engine.meshFrameBuffer);
        renderer.clearColor(0, 0, 0, 0);
        renderer.clear(true, true, false);
    }

    end(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.endCapture();
        renderer.begin2D();
        renderer.save();
        renderer.useShader();
        renderer.depthTest(false);
        renderer.clearColor(0, 0, 0, 0);
        renderer.clear(true, false, false);
        renderer.centerCamera();
        renderer.draw(engine.colorTexture);
        renderer.restore();
        renderer.end2D();
    }

}
