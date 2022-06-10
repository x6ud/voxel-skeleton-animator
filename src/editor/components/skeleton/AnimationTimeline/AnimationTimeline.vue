<template>
    <div class="animation-timeline rows"
         tabindex="0"
         @keyup.delete="onRemoveKeyframe"
         @keydown.left="onPrevFrame"
         @keydown.right="onNextFrame"
    >
        <div class="frame-duration cols"
             v-if="!minimized"
        >
            <img src="./icons/frame-duration.png" alt=""
                 title="Frame Duration"
            >
            <input-number style="width: 32px"
                          :min="16"
                          :step="1"
                          :value="animation.frameDuration"
                          @input="animation.frameDuration = $event"
            />
            <span>ms</span>
        </div>

        <div class="toolbar">
            <div class="buttons"
                 :style="{width: `${nameWidth + 24}px`}"
            >
                <template v-if="minimized">
                    <button class="icon-button"
                            title="Show"
                            @click="onToggleMinimized"
                    >
                        <img src="./icons/window.png" alt="">
                    </button>
                </template>
                <template v-if="!minimized">
                    <button class="icon-button"
                            title="Hide"
                            @click="onToggleMinimized"
                    >
                        <img src="./icons/minimize.png" alt="">
                    </button>
                </template>
                <template v-if="playing">
                    <button class="icon-button"
                            title="Stop"
                            @click="onStop"
                    >
                        <img src="./icons/stop.png" alt="">
                    </button>
                </template>
                <template v-if="!playing">
                    <button class="icon-button"
                            title="Play"
                            @click="onPlay"
                    >
                        <img src="./icons/play.png" alt="">
                    </button>
                </template>
                <div class="fill"></div>
                <button class="icon-button"
                        title="Copy keyframe"
                        @click="onCopyKeyframe"
                >
                    <img src="./icons/copy.png" alt="">
                </button>
                <button class="icon-button"
                        title="Paste keyframe"
                        @click="onPasteKeyframe"
                >
                    <img src="./icons/paste.png" alt="">
                </button>
                <button class="icon-button"
                        title="Flip keyframe"
                        @click="onFlipKeyframe"
                >
                    <img src="./icons/flip.png" alt="">
                </button>
                <button class="icon-button"
                        title="Set keyframe for every component"
                        @click="onSetKeyframe"
                >
                    <img src="./icons/flag.png" alt="">
                </button>
                <button class="icon-button"
                        :disabled="!selectedNodeId"
                        title="Remove keyframe"
                        @click="onRemoveKeyframe"
                >
                    <img src="./icons/trash.png" alt="">
                </button>
                <button class="icon-button"
                        :disabled="time === 0"
                        title="Move left"
                        @click="onMoveLeft"
                >
                    <img src="./icons/move-left.png" alt="">
                </button>
                <button class="icon-button"
                        title="Move right"
                        @click="onMoveRight"
                >
                    <img src="./icons/move-right.png" alt="">
                </button>
            </div>
            <div class="sep">
                <div class="resize-handler" @mousedown.stop="onResize"></div>
            </div>
            <div class="ticks"
                 ref="ticksDom"
                 @mousedown="onTimelineDrag"
            >
                <div v-for="(tick, index) in ticks"
                     :key="index"
                     class="tick"
                     :class="{active: time === tick}"
                     :style="{flex: `0 0 ${index ? tickSpacing : 12}px`}"
                >
                    <div class="num">{{ tick }}</div>
                </div>
            </div>
        </div>

        <div class="timeline fill"
             v-if="!minimized"
        >
            <div class="content">
                <div class="ticks">
                    <div class="padding" :style="{flex: `0 0 ${nameWidth + 24}px`}"></div>
                    <div v-for="(tick, index) in ticks"
                         :key="index"
                         class="tick"
                         :class="{active: time === tick, last: lastFrame === tick}"
                         :style="{flex: `0 0 ${index ? tickSpacing : 12}px`}"
                    >
                    </div>
                </div>

                <animation-timeline-node v-for="node in model.nodes"
                                         :key="node.id"
                                         :node="node"
                                         :selected-node-id="selectedNodeId"
                                         :time="time"
                                         :animation="animation"
                                         :depth="0"
                                         :name-width="nameWidth"
                                         :offset="offset"
                                         :tick-spacing="tickSpacing"
                                         :selected-component="selectedComponent"
                                         @resize="onResize"
                                         @select="onSelect"
                                         @timeline-drag="onTimelineDrag"
                                         @keyframe-drag="onKeyframeDrag"
                />
            </div>
        </div>
    </div>
</template>

<script src="./AnimationTimeline.ts"></script>

<style lang="scss" scoped>
.animation-timeline {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    outline: none;

    .frame-duration {
        position: absolute;
        z-index: 2;
        right: 2px;
        bottom: 2px;
        align-items: center;
        font-size: 8px;
    }

    .toolbar {
        padding: 0;

        .buttons {
            display: flex;
        }

        .sep {
            position: relative;
            width: 1px;
            height: 24px;
            background: #555;

            .resize-handler {
                position: absolute;
                z-index: 1;
                top: 0;
                bottom: -1px;
                right: -3px;
                width: 6px;
                cursor: ew-resize;
            }
        }

        .ticks {
            display: flex;
            align-items: flex-end;
            flex: 1 1;
            min-width: 0;
            height: 24px;
            overflow: hidden;
            background: #222;
            font-size: 12px;

            .tick {
                position: relative;
                box-sizing: border-box;
                border-right: solid 1px #444;
                height: 8px;
                color: #888;

                &:nth-child(even) {
                    .num {
                        display: none;
                    }
                }

                &.active {
                    border-right-color: #fff;

                    .num {
                        display: block;
                        z-index: 2;
                        color: #fff;
                    }
                }

                .num {
                    position: absolute;
                    z-index: 1;
                    top: -20px;
                    right: -50%;
                    width: 100%;
                    height: 24px;
                    line-height: 24px;
                    text-align: center;
                }
            }
        }
    }

    .timeline {
        position: relative;
        z-index: 1;
        overflow-x: hidden;
        overflow-y: scroll;

        .content {
            position: relative;

            :deep(.animation-timeline-node) {
                position: relative;
                z-index: 2;
            }

            .ticks {
                display: flex;
                position: absolute;
                z-index: 1;
                left: 0;
                right: 0;
                top: 0;
                height: 100%;

                .padding {
                    border-right: solid 1px #444;
                }

                .tick {
                    box-sizing: border-box;
                    border-right: solid 1px #444;

                    &:nth-child(odd) {
                        border-right-color: transparent;
                    }

                    &.last {
                        border-right-color: #cf000c;
                    }

                    &.active {
                        border-right-color: #fff;
                    }
                }
            }
        }
    }
}
</style>
