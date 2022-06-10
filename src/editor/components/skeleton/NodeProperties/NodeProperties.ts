import {computed, defineComponent, PropType} from 'vue';
import {skeletonModelComponentDefs} from '../../../skeleton-engine/component-defs';
import SkeletonModelNode from '../../../skeleton-engine/SkeletonModelNode';

export default defineComponent({
    props: {
        node: {type: SkeletonModelNode, required: true},
        mode: {type: String as PropType<'modeler' | 'animator'>, required: true},
    },
    emits: ['setData', 'waitForPost'],
    setup(props, ctx) {
        const components = computed(function () {
            if (props.mode === 'animator') {
                const ret: typeof props.node.components = {};
                for (let type in props.node.components) {
                    const component = props.node.components[type];
                    const componentInfo = skeletonModelComponentDefs[type];
                    if (componentInfo.interpFunc) {
                        ret[type] = component;
                    }
                }
                return ret;
            } else {
                return props.node.components;
            }
        });

        function onWaitForPost(type: string, value: any) {
            onSetData(false, type, value);
        }

        function onInput(type: string, value: any) {
            onSetData(true, type, value);
        }

        function onSetData(post: boolean, type: string, value: any) {
            const componentClass = skeletonModelComponentDefs[type]?.constructor;
            if (!componentClass) {
                throw new Error(`Failed to get component class ${type}`);
            }
            ctx.emit(post ? 'setData' : 'waitForPost', props.node, componentClass, value);
        }

        return {
            skeletonModelComponentDefs,
            components,
            onWaitForPost,
            onInput,
        };
    }
});