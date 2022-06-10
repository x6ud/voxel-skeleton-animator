import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';
import UpdateSystem from '../../utils/UpdateSystem';

export abstract class NodeUpdateFilter {
    children: NodeUpdateFilter[] = [];

    sub(...children: NodeUpdateFilter[]) {
        this.children.push(...children);
        return this;
    }

    abstract update(engine: SkeletonEngine, node: SkeletonModelNode): void;
}

function updateNode(engine: SkeletonEngine, node: SkeletonModelNode, filter: NodeUpdateFilter) {
    filter.update(engine, node);
    for (let child of filter.children) {
        updateNode(engine, node, child);
    }
}

export default class NodesUpdateSystem extends UpdateSystem<SkeletonEngine> {

    private filters: NodeUpdateFilter[];

    constructor(...filters: NodeUpdateFilter[]) {
        super();
        this.filters = filters;
    }

    begin(engine: SkeletonEngine): void {
        if (engine.activeModel.dirty) {
            const stack: SkeletonModelNode[] = [];
            const model = engine.mode === 'modeler' ? engine.model : engine.animationModel;
            stack.push(...model.nodes);
            for (; ;) {
                const node = stack.pop();
                if (!node) {
                    break;
                }
                for (let filter of this.filters) {
                    updateNode(engine, node, filter);
                }
                stack.push(...node.children);
            }
            engine.activeModel.dirty = false;
        }
    }

    end(engine: SkeletonEngine): void {
    }

}
