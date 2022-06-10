import {defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: String,
        readonly: Boolean,
        disabled: Boolean,
    },
    emits: ['input', 'waitForPost'],
    setup(props, ctx) {
        const inputDom = ref<HTMLInputElement>();

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
                onInput(false)
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
                const input = inputDom.value;
                if (input) {
                    ctx.emit(post ? 'input' : 'waitForPost', input.value);
                }
            }
        }

        return {inputDom, onChange, onInput};
    }
});