import {defineComponent, Ref, ref} from 'vue';
import SkeletonEngine from '../../../skeleton-engine/SkeletonEngine';
import SkeletonModel from '../../../skeleton-engine/SkeletonModel';
import SkeletonModelNode from '../../../skeleton-engine/SkeletonModelNode';
import ModelTreeNode from './ModelTreeNode.vue';

export default defineComponent({
    components: {
        ModelTreeNode,
    },
    props: {
        engine: {type: SkeletonEngine, required: true},
        model: {type: SkeletonModel, required: true},
        selectedNodeId: Number,
        readonly: Boolean,
    },
    emits: [
        'select',
        'moveNode',
    ],
    setup(props, ctx) {
        const draggingNode = ref(null) as Ref<SkeletonModelNode | null>;
        const dragOverNode = ref(null) as Ref<SkeletonModelNode | null>;
        const dragOverPosition = ref<'before' | 'inside' | 'after'>('before');

        function select(nodeId: number) {
            ctx.emit('select', nodeId);
        }

        function onDragStart(node: SkeletonModelNode) {
            if (props.readonly) {
                return;
            }
            draggingNode.value = node;
            dragOverNode.value = null;
            const onMouseUp = function () {
                if (draggingNode.value !== dragOverNode.value
                    && draggingNode.value
                    && dragOverNode.value
                ) {
                    ctx.emit('moveNode', draggingNode.value, dragOverNode.value, dragOverPosition.value);
                }
                draggingNode.value = null;
                dragOverNode.value = null;
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mouseup', onMouseUp);
        }

        function onDragOver(node: SkeletonModelNode, position: 'before' | 'inside' | 'after') {
            if (props.readonly) {
                return;
            }
            dragOverNode.value = node;
            dragOverPosition.value = position;
        }

        return {
            draggingNode,
            dragOverNode,
            dragOverPosition,

            select,
            onDragStart,
            onDragOver,
        };
    }
});