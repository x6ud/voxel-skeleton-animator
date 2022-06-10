import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';
import {skeletonModelerTools} from '../tools';

export default class ToolPostSolveSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const tool = skeletonModelerTools[engine.tool];
        tool.onPostSolve(engine);
    }

    end(engine: SkeletonEngine): void {
    }

}
