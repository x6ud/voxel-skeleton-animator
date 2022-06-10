import {defineComponent, onBeforeUnmount, PropType, ref} from 'vue';

export default defineComponent({
    props: {
        value: Array as PropType<number[]>,
        readonly: Boolean,
        disabled: Boolean,
    },
    emits: ['input', 'waitForPost'],
    setup(props, ctx) {
        const input0 = ref<HTMLInputElement>();
        const input1 = ref<HTMLInputElement>();

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
                let x = Number(input0.value?.value || '0') || 0;
                let y = Number(input1.value?.value || '0') || 0;
                ctx.emit(post ? 'input' : 'waitForPost', [x, y]);
            }
        }

        return {
            input0,
            input1,
            onChange,
            onInput,
        };
    }
});