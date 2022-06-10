<template>
    <div class="model-tree-node"
         :class="classnames"
         @mousedown.stop="onMouseDown"
         @mousemove="onMouseMove"
         ref="dom"
    >
        <div class="state">
            <div class="icon visibility"
                 v-if="hasVisibility"
                 :class="{visible: visible}"
                 @click="toggleVisible"
            ></div>
        </div>
        <div class="state">
            <div class="icon expand"
                 v-if="hasChild"
                 :class="{expanded: node.expanded}"
                 @click="node.expanded = !node.expanded"
            ></div>
        </div>
        <div class="name"
             :style="{'padding-left': `${depth * 16 + 2}px`}"
             @click="select(node.id)"
        >
            {{ name }}
        </div>
    </div>
    <template v-if="node.expanded">
        <model-tree-node v-for="child in node.children"
                         :engine="engine"
                         :node="child"
                         :selected-node-id="selectedNodeId"
                         :depth="depth + 1"
                         :dragging-node="draggingNode"
                         :drag-over-node="dragOverNode"
                         :drag-over-position="dragOverPosition"
                         @select="select"
                         @drag-start="onDragStart"
                         @drag-over="onDragOver"
        />
    </template>
</template>

<script src="./ModelTreeNode.ts"></script>

<style lang="scss" scoped>
.model-tree-node {
    display: flex;
    align-items: center;
    position: relative;
    flex: 1 1;
    min-width: 0;
    height: 24px;
    font-size: 12px;
    border-bottom: solid 1px #555;

    &:hover {
        background: #444;
    }

    &.selected {
        background: #666;
    }

    // ==============================================

    &.dragging {
        background: #666;
    }

    &.drag-over-inside {
        &:before {
            content: '';
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            border: solid 1px red;
            pointer-events: none;
        }
    }

    &.drag-over-before,
    &.drag-over-after {
        background-color: #222;

        &::before {
            content: '';
            display: block;
            position: absolute;
            left: 0;
            right: 0;
            z-index: 1;
            height: 1px;
            background: red;
        }
    }

    &.drag-over-before::before {
        top: 0;
    }

    &.drag-over-after::before {
        bottom: 0;
    }

    // ==============================================

    .state {
        flex: 0 0 24px;
        width: 24px;
        height: 24px;
        border-right: solid 1px #555;

        .icon {
            width: 24px;
            height: 24px;
        }
    }

    .visibility {
        background: url("./icons/invisible.png");

        &.visible {
            background: url("./icons/visible.png");
        }
    }

    .expand {
        background: url("./icons/plus.png");

        &.expanded {
            background: url("./icons/minus.png");
        }
    }

    .name {
        flex: 1 1;
        min-width: 0;
        height: 24px;
        line-height: 24px;
        padding: 0 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        user-select: none;
    }
}
</style>