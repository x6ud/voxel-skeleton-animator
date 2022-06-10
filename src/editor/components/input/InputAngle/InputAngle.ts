import {computed, defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: Number,
        readonly: Boolean,
        disabled: Boolean,
    },
    emits: ['input', 'waitForPost'],
    setup(props, ctx) {
        const inputDom = ref<HTMLInputElement>();
        const text = computed(function () {
            return Math.round((props.value || 0) / Math.PI * 180 * 100) / 100;
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
                const input = inputDom.value;
                if (input) {
                    const str = input.value;
                    let number = Number(str);
                    number = number / 180 * Math.PI;
                    if (!isFinite(number)) {
                        number = 0;
                    }
                    ctx.emit(post ? 'waitForPost' : 'input', number);
                }
            }
        }

        return {inputDom, text, onChange, onInput};
    }
});