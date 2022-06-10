import {defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: Number,
        readonly: Boolean,
        disabled: Boolean,
        min: Number,
        max: Number,
        step: Number
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
                    const str = input.value;
                    let number = Number(str);
                    if (!isFinite(number)) {
                        number = 0;
                    }
                    if (props.step != null) {
                        number = Math.round(number / props.step) * props.step;
                    }
                    if (props.min != null) {
                        number = Math.max(props.min, number);
                    }
                    if (props.max != null) {
                        number = Math.min(props.max, number);
                    }
                    ctx.emit(post ? 'input' : 'waitForPost', number);
                }
            }
        }

        return {inputDom, onChange, onInput};
    }
});