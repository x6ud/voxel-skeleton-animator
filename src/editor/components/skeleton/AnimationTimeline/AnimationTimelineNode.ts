import {computed, defineComponent, ref} from 'vue';
import {skeletonModelComponentDefs} from '../../../skeleton-engine/component-defs';
import Name from '../../../skeleton-engine/components/Name';
import {skeletonModelNodeDefs} from '../../../skeleton-engine/node-defs';
import SkeletonAnimation from '../../../skeleton-engine/SkeletonAnimation';
import SkeletonModelNode from '../../../skeleton-engine/SkeletonModelNode';

export default defineComponent({
    name: 'animation-timeline-node',
    props: {
        node: {type: SkeletonModelNode, required: true},
        animation: {type: SkeletonAnimation, required: true},
        selectedNodeId: Number,
        time: {type: Number, required: true},
        depth: {type: Number, required: true},
        nameWidth: {type: Number, required: true},
        offset: {type: Number, required: true},
        tickSpacing: {type: Number, required: true},
        selectedComponent: String,
    },
    emits: [
        'resize',
        'select',
        'timelineDrag',
        'keyframeDrag',
    ],
    setup(props, ctx) {
        const showComponents = ref(false);
        const showChildren = ref(true);
        const name = computed(function () {
            const node = props.node;
            return node.getValueOrElse(Name, `${node.type} #${node.id}`);
        });
        const nodeKeyframes = computed(function () {
            const nodeId = props.node.id;
            const animation = props.animation;
            const ret: { [time: number]: number } = {};
            for (let keyframe of animation.keyframes) {
                if (keyframe.time >= props.offset && keyframe.nodeId === nodeId) {
                    ret[keyframe.time] = keyframe.time;
                }
            }
            return ret;
        });
        const components = computed(function () {
            const node = props.node;
            const nodeDef = skeletonModelNodeDefs[node.type];
            const nodeId = props.node.id;
            const animation = props.animation;
            const ret: { name: string, keyframes: number[] }[] = [];
            for (let componentConstructor of nodeDef.components) {
                const name = componentConstructor.name;
                const componentDef = skeletonModelComponentDefs[name];
                if (componentDef.interpFunc) {
                    const keyframes: number[] = [];
                    for (let keyframe of animation.keyframes) {
                        if (keyframe.time >= props.offset && keyframe.nodeId === nodeId && keyframe.component === name) {
                            keyframes.push(keyframe.time);
                        }
                    }
                    ret.push({name, keyframes});
                }
            }
            return ret;
        });
        const selected = computed(function () {
            return props.node.id === props.selectedNodeId;
        });

        function onResize(e: MouseEvent) {
            ctx.emit('resize', e);
        }

        function onSelect(nodeId: number, component?: string) {
            ctx.emit('select', nodeId, component);
        }

        function onTimelineDrag(e: MouseEvent) {
            ctx.emit('timelineDrag', e);
        }

        function onKeyframeDrag(e: MouseEvent, time: number, nodeId: number, component?: string) {
            ctx.emit('keyframeDrag', e, time, nodeId, component);
        }

        return {
            showComponents,
            showChildren,
            name,
            nodeKeyframes,
            components,
            selected,
            onResize,
            onSelect,
            onTimelineDrag,
            onKeyframeDrag,
        };
    }
});