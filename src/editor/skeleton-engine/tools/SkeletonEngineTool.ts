import SkeletonEngine from '../SkeletonEngine';

export default abstract class SkeletonEngineTool {

    abstract name: string;
    abstract label: string;
    abstract icon: string;

    abstract onPreSolve(engine: SkeletonEngine): void;

    abstract onRender(engine: SkeletonEngine): void;

    abstract onRenderPicking(engine: SkeletonEngine): void;

    abstract onPostSolve(engine: SkeletonEngine): void;

}