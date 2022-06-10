<template>
    <div class="animation-timeline-node"
         :class="{selected}"
    >
        <div class="expand">
            <div v-if="node.children.length"
                 class="icon"
                 :class="{collapsed: !showChildren}"
                 @click="showChildren = !showChildren"
            ></div>
        </div>
        <div class="name"
             :style="{'padding-left': `${depth * 16 + 2}px`, width: `${nameWidth}px`}"
        >
            <div class="inner"
                 @click="onSelect(node.id)"
            >
                <div class="expand arrow"
                     v-if="components.length"
                >
                    <div class="icon"
                         :class="{collapsed: !showComponents}"
                         @click="showComponents = !showComponents"
                    ></div>
                </div>
                <div class="text">{{ name }}</div>
            </div>
            <div class="resize-handler" @mousedown.stop="onResize"></div>
        </div>
        <div class="timeline"
             @mousedown="onTimelineDrag"
        >
            <div class="keyframe"
                 v-for="t in nodeKeyframes"
                 :key="t"
                 :class="{active: time === t && node.id === selectedNodeId}"
                 :style="{left: `${(t - offset) * tickSpacing + 12}px`}"
                 @mousedown.stop="onKeyframeDrag($event, t, node.id, undefined)"
            ></div>
        </div>
    </div>

    <template v-if="showComponents">
        <div v-for="component in components"
             :key="component.name"
             class="animation-timeline-node"
             :class="{selected}"
        >
            <div class="expand"></div>
            <div class="name"
                 :style="{'padding-left': `${depth * 16 + 2}px`, width: `${nameWidth}px`}"
            >
                <div class="inner"
                     @click="onSelect(node.id, component.name)"
                >
                    <div class="icon component"></div>
                    <div class="text">{{ component.name }}</div>
                </div>
                <div class="resize-handler" @mousedown.stop="onResize"></div>
            </div>
            <div class="timeline"
                 @mousedown="onTimelineDrag"
            >
                <div class="keyframe"
                     v-for="t in component.keyframes"
                     :key="t"
                     :class="{active: time === t && node.id === selectedNodeId && (selectedComponent === component.name || !selectedComponent)}"
                     :style="{left: `${(t - offset) * tickSpacing + 12}px`}"
                     @mousedown.stop="onKeyframeDrag($event, t, node.id, component.name)"
                ></div>
            </div>
        </div>
    </template>

    <template v-if="showChildren">
        <animation-timeline-node v-for="child in node.children"
                                 :key="child.id"
                                 :node="child"
                                 :selected-node-id="selectedNodeId"
                                 :animation="animation"
                                 :time="time"
                                 :depth="depth + 1"
                                 :name-width="nameWidth"
                                 :offset="offset"
                                 :tick-spacing="tickSpacing"
                                 :selected-component="selectedComponent"
                                 @resize="onResize"
                                 @select="onSelect"
                                 @timeline-drag="onTimelineDrag"
                                 @keyframe-drag="onKeyframeDrag"
        />
    </template>
</template>

<script src="./AnimationTimelineNode.ts"></script>

<style lang="scss" scoped>
.animation-timeline-node {
    display: flex;
    align-items: center;
    font-size: 12px;
    border-bottom: solid 1px #383838;
    user-select: none;

    &.selected {
        background: rgba(255, 255, 255, .1);
    }

    .icon {
        flex: 0 0 24px;
        width: 24px;
        height: 24px;

        &.component {
            background: url("./icons/component.png");
        }
    }

    .expand {
        flex: 0 0 24px;
        width: 24px;
        height: 24px;
        border-right: solid 1px #555;

        .icon {
            background: url("./icons/minus.png");

            &.collapsed {
                background: url("./icons/plus.png");
            }
        }

        &.arrow {
            border-right: none;

            .icon {
                background: url("./icons/arrow-expanded.png");

                &.collapsed {
                    background: url("./icons/arrow-collapsed.png");
                }
            }

        }
    }

    .name {
        display: flex;
        align-items: center;
        position: relative;
        box-sizing: border-box;
        border-right: solid 1px #555;
        min-width: 0;

        .inner {
            display: flex;
            align-items: center;
            flex: 1 1;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
        }

        .resize-handler {
            position: absolute;
            z-index: 1;
            top: -1px;
            bottom: -1px;
            right: -3px;
            width: 6px;
            cursor: ew-resize;
        }
    }

    .timeline {
        position: relative;
        flex: 1 1;
        min-width: 0;
        height: 24px;
        overflow: hidden;

        .keyframe {
            position: absolute;
            top: 1px;
            bottom: 1px;
            box-sizing: border-box;
            width: 6px;
            margin-left: -3px;
            background: #999;

            &.active {
                border: solid 1px #fff;
            }
        }
    }
}
</style>