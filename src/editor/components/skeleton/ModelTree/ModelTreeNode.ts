import {computed, defineComponent, PropType, ref} from 'vue';
import Name from '../../../skeleton-engine/components/Name';
import Visible from '../../../skeleton-engine/components/Visible';
import {skeletonModelNodeDefs, skeletonModelValidRoots} from '../../../skeleton-engine/node-defs';
import SkeletonEngine from '../../../skeleton-engine/SkeletonEngine';
import SkeletonModelNode from '../../../skeleton-engine/SkeletonModelNode';

export default defineComponent({
    name: 'model-tree-node',
    props: {
        engine: {type: SkeletonEngine, required: true},
        node: {type: SkeletonModelNode, required: true},
        selectedNodeId: Number,
        depth: {type: Number, default: 0},
        draggingNode: SkeletonModelNode,
        dragOverNode: SkeletonModelNode,
        dragOverPosition: String as PropType<'before' | 'inside' | 'after'>,
    },
    emits: [
        'select',
        'dragStart',
        'dragOver',
    ],
    setup(props, ctx) {
        const dom = ref<HTMLElement>();
        const classnames = computed(function () {
            const node = props.node;
            const dragging = props.draggingNode === node;
            const dragOver = props.dragOverNode === node;
            return {
                selected: props.selectedNodeId === node.id,
                dragging,
                'drag-over-before': dragOver && props.dragOverPosition === 'before',
                'drag-over-inside': dragOver && props.dragOverPosition === 'inside',
                'drag-over-after': dragOver && props.dragOverPosition === 'after',
            };
        });

        const name = computed(function () {
            const defaultName = `${props.node.type} #${props.node.id}`;
            return props.node.getValueOrElse(Name, defaultName) || defaultName;
        });

        const hasChild = computed(function () {
            return !!props.node.children.length;
        });
        const hasVisibility = computed(function () {
            return !!props.node.getComponent(Visible);
        });
        const visible = computed(function () {
            return props.node.getValueOrElse(Visible, false);
        });

        function select(nodeId: number) {
            ctx.emit('select', nodeId);
        }

        function toggleVisible() {
            props.engine.setData(props.node, Visible, !visible.value);
        }

        function onMouseDown() {
            select(props.node.id);
            onDragStart(props.node);
        }

        function onMouseMove(e: MouseEvent) {
            if (props.draggingNode != null && dom.value) {
                const rect = dom.value.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const threshold = 6;
                let position = y <= threshold ? 'before' : (y >= rect.height - threshold ? 'after' : 'inside');
                if (position === 'after' && props.node.children.length && props.node.expanded) {
                    position = 'inside';
                }
                if (isValidChild(position === 'inside' ? props.node : props.node.parent, props.draggingNode)) {
                    ctx.emit('dragOver', props.node, position);
                }
            }
        }

        function isValidChild(parent: SkeletonModelNode | null, node: SkeletonModelNode): boolean {
            let related = parent;
            while (related) {
                if (related === node) {
                    return false;
                }
                related = related.parent;
            }
            if (parent) {
                return skeletonModelNodeDefs[parent.type].validChildTypes.includes(node.type);
            }
            return !!skeletonModelValidRoots.find(def => def.name === node.type);
        }

        function onDragStart(node: SkeletonModelNode) {
            ctx.emit('dragStart', node);
        }

        function onDragOver(node: SkeletonModelNode, position: 'before' | 'after') {
            ctx.emit('dragOver', node, position);
        }

        return {
            dom,
            classnames,
            name,
            hasChild,
            hasVisibility,
            visible,

            select,
            toggleVisible,
            onMouseDown,
            onMouseMove,
            onDragStart,
            onDragOver,
        };
    }
});