<template>
    <div class="input-vec3">
        <input type="text"
               placeholder="x"
               :value="format(value[0])"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onInput(true)"
               @keydown.enter="onInput(true)"
               ref="input0"
        />
        <input type="text"
               placeholder="y"
               :value="format(value[1])"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onInput(true)"
               @keydown.enter="onInput(true)"
               ref="input1"
        />
        <input type="text"
               placeholder="z"
               :value="format(value[2])"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onInput(true)"
               @keydown.enter="onInput(true)"
               ref="input2"
        />
    </div>
</template>

<script src="./InputVec3.ts"></script>

<style lang="scss" scoped>
.input-vec3 {
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