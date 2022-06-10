import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';

export default class PreviewRenderSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        if (engine.previewCtx2d) {
            const camera = engine.previewCamera;
            camera.perspective = false;
            camera.update(renderer.state.width, renderer.state.height);
            renderer.depthTest(true);
            renderer.depthMask(true);
            renderer.startCapture(engine.meshFrameBuffer);
            renderer.clear(true, true, false);
        }
    }

    end(engine: SkeletonEngine): void {
        if (engine.previewCtx2d) {
            const renderer = engine.renderer;
            renderer.endCapture();
            renderer.save();
            renderer.begin2D();
            renderer.centerCamera();
            renderer.clear(true, true, false);
            if (engine.previewMask) {
                renderer.useShader(engine.fillShader);
                renderer.setColor(1, 1, 1, 1);
                renderer.fill(engine.colorTexture);
            } else {
                renderer.useShader();
                renderer.useShader(engine.outlineShader);
                renderer.uniform('u_depth', engine.depthTexture);
                renderer.uniform('u_threshold', 2.5 / 10000);
                renderer.fill(engine.colorTexture);
            }
            renderer.end2D();
            renderer.restore();

            const ctx2d = engine.previewCtx2d;
            ctx2d.imageSmoothingEnabled = false;
            ctx2d.clearRect(0, 0, ctx2d.canvas.width, ctx2d.canvas.height);
            const width = Math.floor(ctx2d.canvas.width / engine.previewCameraZoom);
            const height = Math.floor(ctx2d.canvas.height / engine.previewCameraZoom);
            renderer.copyTo(
                ctx2d,
                0,
                0,
                width * engine.previewCameraZoom,
                height * engine.previewCameraZoom,
                Math.floor((renderer.canvas.width - width) / 2),
                Math.floor((renderer.canvas.height - height) / 2),
                width,
                height,
            );
        }
    }

}
