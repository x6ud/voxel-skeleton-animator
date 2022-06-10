import {computed, defineComponent, onBeforeUnmount, PropType, ref} from 'vue';
import Color from '../../../../common/utils/Color';

export default defineComponent({
    props: {
        value: Array as PropType<number[]>
    },
    emits: ['input', 'waitForPost'],
    setup(props, ctx) {
        const input = ref<HTMLInputElement>();
        const str = computed(function () {
            if (props.value) {
                return Color.rgb(props.value[0] * 0xff, props.value[1] * 0xff, props.value[2] * 0xff).toString();
            } else {
                return '#000000';
            }
        });

        let dirty = false;

        function postOnMouseDown() {
            if (dirty) {
                onInput(true);
                document.removeEventListener('mousedown', postOnMouseDown);
            }
        }

        function onChange() {
            if (!dirty) {
                dirty = true;
                onInput(false);
                document.addEventListener('mousedown', postOnMouseDown);
            }
        }

        onBeforeUnmount(function () {
            document.removeEventListener('mousedown', postOnMouseDown);
        });

        function onInput(post: boolean) {
            if (dirty) {
                if (post) {
                    dirty = false;
                }
                const color = Color.parse(input.value?.value || 0);
                ctx.emit(post ? 'input' : 'waitForPost', [color.r / 0xff, color.g / 0xff, color.b / 0xff, 1]);
            }
        }

        return {
            input,
            str,
            onChange,
            onInput,
        };
    }
});