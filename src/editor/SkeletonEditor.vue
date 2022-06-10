<template>
    <div class="editor container cols"
         tabindex="0"
         @keydown.ctrl.z="onUndo"
         @keydown.ctrl.y="onRedo"
         @keydown.ctrl.n.prevent="onCreateNew"
         @keydown.ctrl.o.prevent="onOpen"
         @keydown.ctrl.s.prevent="onSave"
         @contextmenu.prevent
         ref="container"
    >
        <!-- ================== tools ================== -->
        <div class="tools">
            <popup-menu>
                <template #trigger>
                    <button class="tool icon-button toggle-button">
                        <img src="./icons/toolbar/files.png" alt="">
                    </button>
                </template>
                <popup-menu-item title="New" popup @click="onCreateNew"/>
                <popup-menu-item title="Open" popup @click="onOpen"/>
                <popup-menu-item sep/>
                <popup-menu-item title="Save" hotkey="Ctrl+S" @click="onSave"/>
                <popup-menu-item title="Save As" popup @click="onSaveAs"/>
            </popup-menu>
            <hr>
            <button class="tool icon-button toggle-button"
                    v-for="item in tools"
                    :title="item.label"
                    :class="{active: tool === item.name}"
                    @click="onSelectTool(item.name)"
            >
                <img :src="item.icon" alt="">
            </button>
        </div>

        <div class="rows fill">
            <div class="cols fill">
                <!-- ================== canvas ================== -->
                <auto-resize-canvas class="fill"
                                    @mounted="onCanvasMounted"
                                    @before-unmounted="onCanvasUnmounted"
                >

                    <div class="anchor" style="right: 4px; top: 4px; font-size: 12px;">FPS: {{ fps }}</div>
                    <div class="anchor" style="top: 2px; left: 2px;">
                        <div>
                            <button class="icon-button"
                                    @click="onSetCameraRotation(0,0)"
                                    title="Right"
                            >
                                <img src="./icons/skull/right.png" alt="">
                            </button>
                            <button class="icon-button"
                                    @click="onSetCameraRotation(0,90)"
                                    title="Front"
                            >
                                <img src="./icons/skull/front.png" alt="">
                            </button>
                            <button class="icon-button"
                                    @click="onSetCameraRotation(-90,0)"
                                    title="Top"
                            >
                                <img src="./icons/skull/top.png" alt="">
                            </button>
                        </div>
                        <div>
                            <button class="icon-button"
                                    @click="onSetCameraRotation(0,180)"
                                    title="Left"
                            >
                                <img src="./icons/skull/left.png" alt="">
                            </button>
                            <button class="icon-button"
                                    @click="onSetCameraRotation(0,-90)"
                                    title="Back"
                            >
                                <img src="./icons/skull/back.png" alt="">
                            </button>
                            <button class="icon-button"
                                    @click="onSetCameraRotation(90,0)"
                                    title="Bottom"
                            >
                                <img src="./icons/skull/bottom.png" alt="">
                            </button>
                        </div>
                    </div>
                </auto-resize-canvas>

                <!-- ================== properties ================== -->
                <side-panel v-model:width="propertiesPanelWidth"
                            :max-width="600"
                            style="border-right: none; border-bottom: none;"
                >
                    <div class="rows"
                         style="width: 100%; height: 100%;"
                    >
                        <div class="rows"
                             style="overflow: hidden;"
                             :style="{height: `${previewPanelHeight}px`}"
                        >
                            <auto-resize-canvas class="fill"
                                                @mounted="onPreviewCanvasMounted"
                                                @before-mounted="onPreviewCanvasUnmounted"
                            >
                                <div class="anchor cols" style="top: 0; left: 2px; right: 2px; align-items: center;">
                                    <button class="icon-button toggle-button"
                                            :class="{active: previewMask}"
                                            @click="onTogglePreviewMask"
                                    >
                                        <img src="./icons/toolbar/mask.png" alt="">
                                    </button>
                                    <input type="range"
                                           min="0"
                                           max="8"
                                           value="0"
                                           @input="onSetPreviewModelRotation"
                                    >
                                </div>
                            </auto-resize-canvas>
                        </div>

                        <vertical-splitter v-model:size="previewPanelHeight"
                                           :min="200"
                                           :max="800"
                        />

                        <div class="toolbar">
                            <div class="tab"
                                 :class="{active: !showPalettes}"
                                 @click="showPalettes = false"
                            >
                                Properties
                            </div>
                            <div class="tab"
                                 :class="{active: showPalettes}"
                                 @click="showPalettes = true"
                            >
                                Palettes
                            </div>
                        </div>

                        <div class="fill" style="overflow: auto">
                            <template v-if="showPalettes">
                                <palettes-panel v-model:color1="color1"
                                                v-model:color2="color2"
                                                v-model:mouseRightAsEraser="mouseRightAsEraser"
                                                eraser
                                />
                            </template>
                            <template v-else>
                                <template v-if="selectedNode">
                                    <node-properties :mode="mode"
                                                     :node="selectedNode"
                                                     @set-data="onSetData"
                                                     @wait-for-post="onWaitForNodeValueInputPost"
                                    />
                                </template>
                            </template>
                        </div>
                    </div>
                </side-panel>

                <!-- ================== tree ================== -->
                <side-panel class="rows"
                            v-model:width="modelTreeWidth"
                            :max-width="600"
                            style="border-bottom: none;"
                >
                    <div class="toolbar">
                        <div class="fill"></div>
                        <div class="tab"
                             :class="{active: mode === 'modeler'}"
                             @click="mode = 'modeler'"
                        >
                            Modeler
                        </div>
                        <div class="tab"
                             :class="{active: mode === 'animator'}"
                             @click="mode = 'animator'"
                        >
                            Animator
                        </div>
                    </div>

                    <template v-if="mode === 'animator'">
                        <div class="toolbar" style="padding: 0;">
                            <select v-model="currentAnimationId"
                                    class="fill"
                                    style="border-radius: 0;"
                            >
                                <option v-for="animation in animations"
                                        :value="animation.id">
                                    {{ animation.name || `Animation #${animation.id}` }}
                                </option>
                            </select>
                            <button class="icon-button"
                                    :disabled="!currentAnimationId"
                                    title="Rename"
                                    @click="onRenameAnimation"
                            >
                                <img src="./icons/toolbar/rename.png" alt="">
                            </button>
                            <button class="icon-button"
                                    :disabled="!currentAnimationId"
                                    title="Clone"
                                    @click="onCloneAnimation"
                            >
                                <img src="./icons/toolbar/copy.png" alt="">
                            </button>
                            <button class="icon-button"
                                    @click="onAddAnimation"
                                    title="Add"
                            >
                                <img src="./icons/toolbar/add.png" alt="">
                            </button>
                            <button class="icon-button"
                                    :disabled="!currentAnimationId"
                                    @click="onRemoveAnimation"
                                    title="Remove"
                            >
                                <img src="./icons/toolbar/trash.png" alt="">
                            </button>
                        </div>
                    </template>

                    <div class="toolbar"
                         v-if="mode === 'modeler'"
                    >
                        <popup-menu>
                            <template #trigger>
                                <img src="./icons/toolbar/add.png" alt="">
                                <span>Add</span>
                            </template>
                            <popup-menu-item v-for="childDef in validChildDefs"
                                             :title="childDef.label"
                                             @click="onAddNode(childDef)"
                            />
                            <template v-if="selectedNodeId">
                                <popup-menu-item sep/>
                                <popup-menu-item title="Clone" @click="onCloneNode(selectedNodeId, false)"/>
                                <popup-menu-item title="Mirror" @click="onCloneNode(selectedNodeId, true)"/>
                            </template>
                        </popup-menu>
                        <div class="fill"></div>
                        <button class="icon-button"
                                title="Delete"
                                :disabled="!selectedNodeId"
                                @click="onRemoveNode(selectedNodeId)"
                        >
                            <img src="./icons/toolbar/trash.png" alt="">
                        </button>
                    </div>

                    <model-tree class="fill"
                                :engine="engine"
                                :model="mode === 'modeler' ? model : animationModel"
                                :readonly="mode === 'animator'"
                                :selected-node-id="selectedNodeId"
                                @select="onSelectNode"
                                @move-node="onMoveNode"
                    />
                </side-panel>
            </div>

            <template v-if="mode === 'animator' && currentAnimation">
                <vertical-splitter v-model:size="animationPanelHeight"
                                   reverse
                                   :min-size="100"
                                   :fixed="animationPanelMinimized"
                />
                <div :style="{height: `${animationPanelMinimized ? 24 : animationPanelHeight}px`}">
                    <animation-timeline :engine="engine"
                                        :model="animationModel"
                                        :selected-node-id="selectedNodeId"
                                        :animation="currentAnimation"
                                        v-model:time="time"
                                        v-model:minimized="animationPanelMinimized"
                                        @select="onSelectNode"
                                        @remove-keyframe="onRemoveKeyframe"
                                        @move-keyframe="onMoveKeyframe"
                                        @set-keyframe="onSetKeyframe"
                                        @move-left="onTimelineMoveLeft"
                                        @move-right="onTimelineMoveRight"
                                        @copy-keyframe="onCopyKeyframe"
                                        @paste-keyframe="onPasteKeyframe"
                                        @flip-keyframe="onFlipKeyframe"
                    />
                </div>
            </template>
        </div>
    </div>
</template>

<script src="./SkeletonEditor.ts"></script>

<style lang="scss" src="./ui.scss"></style>

<style lang="scss" scoped>
.editor {
    .tools {
        display: flex;
        flex-direction: column;
        padding: 0 2px;
        border-right: solid 1px #555;

        .tool {
            width: 24px;
            height: 24px;
            margin: 4px 0 0 0;
        }

        hr {
            height: 1px;
            padding: 0;
            margin: 4px 0 0 0;
            border: none;
            background: #999;
        }
    }

    .canvas-wrapper {
        user-select: none;

        .anchor {
            position: absolute;
            z-index: 2;
        }
    }
}
</style>
