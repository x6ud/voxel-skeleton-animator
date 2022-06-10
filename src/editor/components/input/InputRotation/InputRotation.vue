<template>
    <div class="input-rotation">
        <div class="inputs">
            <input type="text"
                   :value="degrees[0]"
                   :readonly="readonly"
                   :disabled="disabled"
                   @input="onChange"
                   @keydown.enter="onInput(true)"
                   ref="input0"
            />
            <input type="text"
                   :value="degrees[1]"
                   :readonly="readonly"
                   :disabled="disabled"
                   @input="onChange"
                   @keydown.enter="onInput(true)"
                   ref="input1"
            />
            <input type="text"
                   :value="degrees[2]"
                   :readonly="readonly"
                   :disabled="disabled"
                   @input="onChange"
                   @keydown.enter="onInput(true)"
                   ref="input2"
            />
        </div>
    </div>
</template>

<script src="./InputRotation.ts"></script>

<style lang="scss" scoped>
.input-rotation {
    display: inline-flex;

    .inputs {
        flex: 1 1;
        min-width: 0;
        height: 24px;
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
}
</style>