<template>
    <div class="model-tree"
         @click.self="select(0)"
    >
        <model-tree-node v-for="node in model.nodes"
                         :engine="engine"
                         :selected-node-id="selectedNodeId"
                         :node="node"
                         :dragging-node="draggingNode"
                         :drag-over-node="dragOverNode"
                         :drag-over-position="dragOverPosition"
                         @select="select"
                         @drag-start="onDragStart"
                         @drag-over="onDragOver"
        />
    </div>
</template>

<script src="./ModelTree.ts"></script>

<style lang="scss" scoped>
.model-tree {
    overflow: auto;
}
</style>