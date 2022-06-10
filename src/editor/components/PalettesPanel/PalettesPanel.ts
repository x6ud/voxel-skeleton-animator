import {computed, defineComponent, ref} from 'vue';
import Color from '../../../common/utils/Color';
import {palettes} from './palettes';

export default defineComponent({
    props: {
        color1: Number,
        color2: Number,
        mouseRightAsEraser: Boolean,
        eraser: Boolean,
    },
    setup(props, ctx) {
        const paletteIndex = ref(0);
        const color1Parsed = computed(function () {
            return Color.parse(props.color1 || 0);
        });
        const color2Parsed = computed(function () {
            return Color.parse(props.color2 || 0);
        });

        function onMouseLeftSelect(color: Color) {
            ctx.emit('update:color1', color.valueOf());
        }

        function onMouseRightSelect(color: Color) {
            ctx.emit('update:color2', color.valueOf());
            ctx.emit('update:mouseRightAsEraser', false);
        }

        function toggleMouseRightAsEraser() {
            ctx.emit('update:mouseRightAsEraser', !props.mouseRightAsEraser);
        }

        return {
            palettes,

            paletteIndex,
            color1Parsed,
            color2Parsed,

            onMouseLeftSelect,
            onMouseRightSelect,
            toggleMouseRightAsEraser,
        };
    }
});
