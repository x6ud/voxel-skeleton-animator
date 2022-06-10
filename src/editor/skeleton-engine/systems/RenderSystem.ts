import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';

export default class RenderSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        if (engine.canvas) {
            renderer.resizeCanvas(engine.canvas.width, engine.canvas.height);
        }
        const camera = engine.camera;
        camera.perspective = !!(camera.rotateXDeg % 90 || camera.rotateYDeg % 90);
        camera.update(renderer.state.width, renderer.state.height);
    }

    end(engine: SkeletonEngine): void {
        if (engine.ctx2d) {
            const renderer = engine.renderer;
            engine.ctx2d.clearRect(0, 0, renderer.state.width, renderer.state.height);
            renderer.copyTo(engine.ctx2d);
        }
    }

}
