<template>
    <input class="input-angle"
           type="text"
           :value="text"
           :readonly="readonly"
           :disabled="disabled"
           @input="onChange"
           @blur="onInput(true)"
           @keydown.enter="onInput(true)"
           ref="inputDom"
    >
</template>

<script src="./InputAngle.ts"></script>

<style lang="scss" scoped>
.input-angle {
    min-height: 24px;
}
</style>