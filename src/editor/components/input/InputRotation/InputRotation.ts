import {quat} from 'gl-matrix';
import {computed, defineComponent, onBeforeUnmount, PropType, ref} from 'vue';
import {eulerToQuat, quatToEuler} from '../../../utils/geometry/math';

const RAD_TO_DEG = 1 / Math.PI * 180;
const DEG_TO_RAD = 1 / 180 * Math.PI;

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
        const input2 = ref<HTMLInputElement>();

        const euler = computed(function () {
            const ret: [number, number, number] = [0, 0, 0];
            const q = (props.value || [0, 0, 0, 1]) as [number, number, number, number];
            quatToEuler(ret, q);
            return ret;
        });

        function format(val: number) {
            return Number(val.toFixed(3));
        }

        const degrees = computed(function () {
            return [
                format(euler.value[0] * RAD_TO_DEG),
                format(euler.value[1] * RAD_TO_DEG),
                format(euler.value[2] * RAD_TO_DEG),
            ];
        });

        let dirty = false;

        function postOnMouseDown(e: MouseEvent) {
            if (e.target === input0.value
                || e.target === input1.value
                || e.target === input2.value
            ) {
                return;
            }
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
                ctx.emit(post ? 'input' : 'waitForPost', eulerToQuat(
                    [0, 0, 0, 1] as quat,
                    (Number(input2.value?.value || '0') || 0) * DEG_TO_RAD,
                    (Number(input1.value?.value || '0') || 0) * DEG_TO_RAD,
                    (Number(input0.value?.value || '0') || 0) * DEG_TO_RAD
                ));
            }
        }

        return {
            degrees,
            input0,
            input1,
            input2,
            onChange,
            onInput,
        };
    }
});
