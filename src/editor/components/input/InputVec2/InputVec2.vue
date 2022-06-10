<template>
    <div class="input-vec2">
        <input type="text"
               placeholder="x"
               :value="value[0]"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onInput(true)"
               @keydown.enter="onInput(true)"
               ref="input0"
        />
        <input type="text"
               placeholder="y"
               :value="value[1]"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onInput(true)"
               @keydown.enter="onInput(true)"
               ref="input1"
        />
    </div>
</template>

<script src="./InputVec2.ts"></script>

<style lang="scss" scoped>
.input-vec2 {
    display: inline-flex;

    input {
        flex: 1 1;
        min-width: 0;
        min-height: 24px;

        &:not(:first-child) {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }

        &:not(:last-child) {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            margin-right: 1px;
        }
    }
}
</style>