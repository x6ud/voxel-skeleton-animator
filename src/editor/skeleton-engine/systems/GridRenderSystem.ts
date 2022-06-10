import Axes from '../../utils/meshes/Axes';
import XZPanelGrid from '../../utils/meshes/XZPanelGrid';
import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';

const WHITE = [1, 1, 1, 1];
const GRID_SIZE = 16;

export default class GridRenderSystem extends UpdateSystem<SkeletonEngine> {

    private readonly axes = new Axes(1000 * GRID_SIZE);
    private readonly xzPanelGrid = new XZPanelGrid(1000, GRID_SIZE);

    begin(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.useShader(engine.lineShader);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        renderer.uniform('u_zBias', -0.0001);
        renderer.uniform('u_color', WHITE);
        renderer.uniform('u_mMatrix', this.axes.matrix);
        this.axes.render(renderer);
        renderer.uniform('u_mMatrix', this.xzPanelGrid.matrix);
        this.xzPanelGrid.render(renderer);
    }

    end(engine: SkeletonEngine): void {
    }

}
