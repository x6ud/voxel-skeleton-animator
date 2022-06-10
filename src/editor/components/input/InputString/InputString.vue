<template>
    <input class="input-string"
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

<script src="./InputString.ts"></script>

<style lang="scss" scoped>
.input-string {
    min-height: 24px;
}
</style>