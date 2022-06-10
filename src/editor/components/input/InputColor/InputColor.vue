<template>
    <input class="input-color"
           type="color"
           :value="str"
           @input="onChange"
           @blur="onInput(true)"
           ref="input"
    >
</template>

<script src="./InputColor.ts"></script>

<style lang="scss" scoped>
.input-color {
    flex: auto !important;
    min-height: 24px;
    padding: 0;
    border-radius: 0;
    background: #444;
    border: none;
}
</style>