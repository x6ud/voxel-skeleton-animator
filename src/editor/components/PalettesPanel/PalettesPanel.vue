<template>
    <div class="palettes-panel">
        <div class="mouse-buttons cols">
            <img src="./mouse-left.png" alt="" title="Mouse Left">
            <div class="color"
                 :style="{'background-color': color1Parsed.toString()}"
                 :title="color1Parsed.toString()"
            ></div>
            <img src="./mouse-right.png" alt="" title="Mouse Right">
            <div class="color"
                 :style="{'background-color': color2Parsed.toString()}"
                 :title="color2Parsed.toString()"
            ></div>
            <template v-if="eraser">
                <button class="toggle-button icon-button"
                        :class="{active: mouseRightAsEraser}"
                        @click="toggleMouseRightAsEraser()"
                        title="Mouse Right as Eraser"
                >
                    <img src="./eraser.png" alt="">
                </button>
            </template>
        </div>

        <select v-model="paletteIndex">
            <option v-for="(item, index) in palettes"
                    :key="index"
                    :value="index"
            >
                {{ item.name }}
            </option>
        </select>

        <div class="colors scrollable">
            <div class="scroll">
                <div v-for="(color, index) in palettes[paletteIndex].colors"
                     :key="index"
                     class="color"
                     :class="{active1: color.valueOf() === color1Parsed.valueOf(), active2: color.valueOf() === color2Parsed.valueOf()}"
                     :style="{'background-color': color.toString()}"
                     :title="color.toString()"
                     @click.left="onMouseLeftSelect(color)"
                     @click.right="onMouseRightSelect(color)"
                ></div>
            </div>
        </div>
    </div>
</template>

<script src="./PalettesPanel.ts"></script>

<style lang="scss" scoped>
.palettes-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 4px;
    box-sizing: border-box;

    .mouse-buttons {
        margin-bottom: 4px;
        align-items: flex-start;

        .color {
            margin-right: 4px;
        }
    }

    select {
        margin-bottom: 4px;
    }

    .color {
        box-sizing: border-box;
        width: 24px;
        height: 24px;
        border: solid 1px #000;
        border-radius: 3px;
    }

    .colors {
        flex: 1 1;
        min-height: 0;

        .scroll {
            padding: 1px;
            right: -12px;
        }

        .color {
            float: left;
            margin: 0 4px 4px 0;

            &:hover {
                outline: solid 1px #fff;
            }

            &.active1,
            &.active2 {
                outline: solid 1px #fff;
            }
        }
    }
}
</style>
