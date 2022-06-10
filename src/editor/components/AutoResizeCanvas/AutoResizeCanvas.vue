<template>
    <div class="canvas-wrapper"
         ref="canvasWrapper"
    >
        <canvas ref="canvas"></canvas>
        <slot/>
    </div>
</template>

<script src="./AutoResizeCanvas.ts"></script>

<style lang="scss" scoped>
.canvas-wrapper {
    position: relative;
    overflow: hidden;
    background: #2f2f2f;

    canvas {
        position: relative;
        z-index: 1;
    }
}
</style>
