import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';
import {skeletonModelerTools} from '../tools';

export default class ToolPreSolveSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const tool = skeletonModelerTools[engine.tool];
        tool.onPreSolve(engine);
    }

    end(engine: SkeletonEngine): void {
    }

}
