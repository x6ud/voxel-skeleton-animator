<template>
    <popup-dialog modal
                  title="Open"
                  closable
                  v-model:visible="visible"
                  width="640px"
    >
        <div class="files">
            <div class="file"
                 v-for="file in files"
                 @click="filename = file, visible = false"
            >
                {{ file }}
            </div>
        </div>
    </popup-dialog>
</template>

<script src="./OpenDialog.ts"></script>

<style lang="scss" scoped>
.files {
    height: 320px;
    margin-bottom: 6px;
    background: #444;
    border-radius: 3px;
    overflow-y: scroll;
    font-size: 14px;

    .file {
        padding: 4px .5em;
        cursor: pointer;

        &:hover {
            background: #333;
        }
    }
}
</style>