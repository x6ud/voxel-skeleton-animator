import {defineComponent, onBeforeUnmount, onMounted, ref} from 'vue';

export default defineComponent({
    setup(props, ctx) {
        const canvasWrapper = ref<HTMLDivElement>();
        const canvas = ref<HTMLCanvasElement>();

        let tid: NodeJS.Timer;

        onMounted(function () {
            resize();
            ctx.emit('mounted', canvas.value);
            tid = setInterval(resize, 200);
        });

        onBeforeUnmount(function () {
            ctx.emit('beforeUnmount');
            clearInterval(tid);
        });

        function resize() {
            const rect = canvasWrapper.value!.getBoundingClientRect();
            const dom = canvas.value!;
            if (rect.width !== dom.width || rect.height !== dom.height) {
                dom.width = rect.width;
                dom.height = rect.height;
                ctx.emit('resize', rect.width, rect.height);
            }
        }

        return {
            canvasWrapper,
            canvas,
        };
    }
});