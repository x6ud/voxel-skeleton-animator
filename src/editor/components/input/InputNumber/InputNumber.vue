<template>
    <input class="input-number"
           type="text"
           :value="value"
           :readonly="readonly"
           :disabled="disabled"
           @input="onChange"
           @blur="onInput(true)"
           @keydown.enter="onInput(true)"
           ref="inputDom"
    >
</template>

<script src="./InputNumber.ts"></script>

<style lang="scss" scoped>
.input-number {
    min-height: 24px;
}
</style>