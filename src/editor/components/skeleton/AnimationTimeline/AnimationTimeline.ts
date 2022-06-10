import {computed, defineComponent, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {addGlobalDragListener} from '../../../../common/utils/dom';
import SkeletonAnimation from '../../../skeleton-engine/SkeletonAnimation';
import SkeletonEngine from '../../../skeleton-engine/SkeletonEngine';
import SkeletonModel from '../../../skeleton-engine/SkeletonModel';
import InputNumber from '../../input/InputNumber/InputNumber.vue';
import AnimationTimelineNode from './AnimationTimelineNode.vue';

export default defineComponent({
    components: {AnimationTimelineNode, InputNumber},
    props: {
        engine: {type: SkeletonEngine, required: true},
        model: {type: SkeletonModel, required: true},
        animation: {type: SkeletonAnimation, required: true},
        selectedNodeId: Number,
        time: {type: Number, required: true},
        minimized: Boolean,
    },
    emits: [
        'select',
        'update:time',
        'update:minimized',
        'removeKeyframe',
        'moveKeyframe',
        'setKeyframe',
        'moveLeft',
        'moveRight',
        'copyKeyframe',
        'pasteKeyframe',
        'flipKeyframe',
    ],
    setup(props, ctx) {
        const ticksDom = ref<HTMLElement>();
        const nameWidth = ref(204);
        const ticksWidth = ref(0);
        const tickSpacing = ref(12);
        const offset = ref(0);
        const ticks = computed(function () {
            const ret: number[] = [];
            const range = Math.ceil(ticksWidth.value / tickSpacing.value);
            for (let i = 0; i <= range; ++i) {
                ret.push(i + offset.value);
            }
            return ret;
        });
        const lastFrame = computed(function () {
            return props.animation.keyframes.reduce((time, frame) => Math.max(time, frame.time), 0);
        });
        const selectedComponent = ref<string | null>();
        const playing = ref(false);

        watch(() => props.animation, function () {
            onStop();
        });

        onBeforeUnmount(function () {
            onStop();
        });

        let resizeTid: NodeJS.Timer;
        onMounted(function () {
            resizeTid = setInterval(measureTicksDomSize, 100);
            measureTicksDomSize();

            function measureTicksDomSize() {
                ticksWidth.value = ticksDom.value!.getBoundingClientRect().width;
            }
        });
        onBeforeUnmount(function () {
            clearInterval(resizeTid);
        });

        function onResize(e: MouseEvent) {
            const size0 = nameWidth.value;
            const x0 = e.clientX;

            addGlobalDragListener(
                e,
                function (e: MouseEvent) {
                    const det = e.clientX - x0;
                    nameWidth.value = Math.max(size0 + det, 192);
                }
            );
        }

        function onSelect(nodeId: number, component?: string) {
            ctx.emit('select', nodeId);
            selectedComponent.value = component;
        }

        function onTimelineDrag(e: MouseEvent) {
            switch (e.button) {
                case 0: {
                    const dx = ticksDom.value!.getBoundingClientRect().left + 12;
                    addGlobalDragListener(
                        e,
                        function (e: MouseEvent) {
                            const pos = e.clientX - dx;
                            const time = Math.max(offset.value + Math.round(pos / tickSpacing.value), 0);
                            ctx.emit('update:time', time);
                        }
                    );
                }
                    break;
                case 2: {
                    const x0 = e.clientX;
                    const offset0 = offset.value;
                    addGlobalDragListener(
                        e,
                        function (e: MouseEvent) {
                            const det = e.clientX - x0;
                            offset.value = Math.max(Math.round(offset0 - det / tickSpacing.value), 0);
                        }
                    );
                }
                    break;
            }
        }

        function onKeyframeDrag(e: MouseEvent, time: number, nodeId: number, component?: string) {
            switch (e.button) {
                case 0: {
                    ctx.emit('select', nodeId);
                    ctx.emit('update:time', time);
                    selectedComponent.value = component;
                    const dx = ticksDom.value!.getBoundingClientRect().left + 12;
                    const animation = props.animation;
                    const all = e.shiftKey;
                    addGlobalDragListener(
                        e,
                        function (e: MouseEvent) {
                            const pos = e.clientX - dx;
                            const newTime = Math.max(offset.value + Math.round(pos / tickSpacing.value), 0);
                            if (time !== newTime) {
                                ctx.emit('update:time', newTime);
                                ctx.emit('moveKeyframe', animation, time, all ? null : nodeId, component, newTime);
                            }
                        }
                    );
                }
                    break;
            }
        }

        function onRemoveKeyframe(e: KeyboardEvent | MouseEvent) {
            if (props.selectedNodeId) {
                ctx.emit('removeKeyframe', props.animation, props.time, e.shiftKey ? null : props.selectedNodeId, selectedComponent.value);
            }
        }

        function onSetKeyframe() {
            ctx.emit('setKeyframe', props.animation, props.time);
        }

        function onMoveLeft() {
            ctx.emit('moveLeft', props.animation, props.time);
        }

        function onMoveRight() {
            ctx.emit('moveRight', props.animation, props.time);
        }

        let timestamp = 0;
        let lastFrameDuration = 0;

        function nextFrame() {
            if (!playing.value) {
                return;
            }
            const now = Date.now();
            lastFrameDuration += now - timestamp;
            timestamp = now;
            let dt = 0;
            const frameDuration = Math.max(16, props.animation.frameDuration) || 16;
            while (lastFrameDuration >= frameDuration) {
                lastFrameDuration -= frameDuration;
                dt += 1;
            }
            let time = props.time + dt;
            while (lastFrame.value && (time > lastFrame.value)) {
                time -= lastFrame.value;
            }
            ctx.emit('update:time', time);
            requestAnimationFrame(nextFrame);
        }

        function onPlay() {
            if (playing.value) {
                return;
            }
            playing.value = true;
            timestamp = Date.now();
            lastFrameDuration = 0;
            nextFrame();
        }

        function onStop() {
            playing.value = false;
        }

        function onCopyKeyframe(e: MouseEvent) {
            if (e.shiftKey) {
                ctx.emit('copyKeyframe', props.animation, props.time);
            } else {
                ctx.emit('copyKeyframe', props.animation, props.time, props.selectedNodeId, selectedComponent.value);
            }
        }

        function onPasteKeyframe() {
            ctx.emit('pasteKeyframe', props.animation, props.time);
        }

        function onFlipKeyframe() {
            ctx.emit('flipKeyframe', props.animation, props.time);
        }

        function onToggleMinimized() {
            ctx.emit('update:minimized', !props.minimized);
        }

        function onPrevFrame() {
            let time = props.time - 1;
            if (time < 0) {
                time = lastFrame.value;
            }
            ctx.emit('update:time', Math.max(0, time));
        }

        function onNextFrame() {
            let time = props.time + 1;
            if (time > lastFrame.value) {
                time = 0;
            }
            ctx.emit('update:time', time);
        }

        return {
            ticksDom,
            nameWidth,
            tickSpacing,
            ticks,
            lastFrame,
            offset,
            selectedComponent,
            playing,

            onResize,
            onSelect,
            onTimelineDrag,
            onKeyframeDrag,
            onRemoveKeyframe,
            onSetKeyframe,
            onMoveLeft,
            onMoveRight,
            onPlay,
            onStop,
            onCopyKeyframe,
            onPasteKeyframe,
            onFlipKeyframe,
            onToggleMinimized,
            onPrevFrame,
            onNextFrame,
        };
    }
});
