import UpdateSystem from '../../utils/UpdateSystem';
import Visible from '../components/Visible';
import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';

export abstract class NodeRenderFilter {
    prioritizeSelectedNode: boolean = true;

    abstract begin(engine: SkeletonEngine): boolean;

    abstract render(engine: SkeletonEngine, node: SkeletonModelNode): void;

    abstract end(engine: SkeletonEngine): void;
}

const stack: SkeletonModelNode[] = [];
const renderList: SkeletonModelNode[] = [];

export default class NodesRenderSystem extends UpdateSystem<SkeletonEngine> {

    private readonly filters: NodeRenderFilter[];

    constructor(...filters: NodeRenderFilter[]) {
        super();
        this.filters = filters;
    }

    begin(engine: SkeletonEngine): void {
        renderList.length = 0;
        stack.length = 0;
        stack.push(...engine.activeModel.nodes);
        for (; ;) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            if (
                node.getValueOrElse(Visible, true)
                && node !== engine.selectedNode
            ) {
                renderList.push(node);
            }
            stack.push(...node.children);
        }
        const selectedNodeVisible = engine.selectedNode?.getValueOrElse(Visible, true);
        for (let filter of this.filters) {
            if (filter.begin(engine)) {
                if (filter.prioritizeSelectedNode && engine.selectedNode && selectedNodeVisible) {
                    filter.render(engine, engine.selectedNode);
                }
                for (let node of renderList) {
                    filter.render(engine, node);
                }
                if (!filter.prioritizeSelectedNode && engine.selectedNode && selectedNodeVisible) {
                    filter.render(engine, engine.selectedNode);
                }
                filter.end(engine);
            }
        }
        renderList.length = 0;
    }

    end(engine: SkeletonEngine): void {
    }

}
