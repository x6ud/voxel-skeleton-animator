import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';
import {skeletonModelerTools} from '../tools';

export default class ToolPickingRenderSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const tool = skeletonModelerTools[engine.tool];
        tool.onRenderPicking(engine);
    }

    end(engine: SkeletonEngine): void {
    }

}
