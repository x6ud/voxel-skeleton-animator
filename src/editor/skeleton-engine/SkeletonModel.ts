import MirrorNodeId from './components/MirrorNodeId';
import SkeletonModelNode from './SkeletonModelNode';

export default class SkeletonModel {
    nodes: SkeletonModelNode[] = [];
    dirty: boolean = true;
    private nodesMap: Map<number, SkeletonModelNode> = new Map();
    private mirrorNodesMap: Map<number, number> = new Map();
    nodeChanged: boolean = true;

    private updateMaps() {
        if (this.nodeChanged) {
            this.nodesMap.clear();
            this.mirrorNodesMap.clear();
            this.forEach(node => {
                this.nodesMap.set(node.id, node);
                const mirrorNodeId = node.getValueOrElse(MirrorNodeId, 0);
                if (mirrorNodeId) {
                    this.mirrorNodesMap.set(mirrorNodeId, node.id);
                    this.mirrorNodesMap.set(node.id, mirrorNodeId);
                }
            });
            this.nodeChanged = false;
        }
    }

    getNode(id: number): SkeletonModelNode | null {
        this.updateMaps();
        return this.nodesMap.get(id) || null;
    }

    getMirrorNode(id: number): SkeletonModelNode | null {
        this.updateMaps();
        const mirrorId = this.mirrorNodesMap.get(id);
        if (mirrorId) {
            return this.nodesMap.get(mirrorId) || null;
        }
        return null;
    }

    forEach(callback: (node: SkeletonModelNode) => void) {
        const stack: SkeletonModelNode[] = [];
        stack.push(...this.nodes);
        for (; ;) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            callback(node);
            stack.push(...node.children);
        }
    }
}