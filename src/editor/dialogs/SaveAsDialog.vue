<template>
    <popup-dialog modal
                  title="Save As"
                  closable
                  v-model:visible="visible"
                  width="640px"
    >
        <div class="files">
            <div class="file"
                 v-for="file in files"
                 @click="filename = file"
            >
                {{ file }}
            </div>
        </div>
        <div class="buttons">
            <input type="text" placeholder="Filename" v-model="filename" @keypress.enter="save">
            <button class="normal-button" @click="save" :disabled="!filename">Save</button>
            <button class="normal-button" @click="cancel">Cancel</button>
        </div>
    </popup-dialog>
</template>

<script src="./SaveAsDialog.ts"></script>

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

.buttons {
    display: flex;
    align-items: center;

    input {
        flex: 1 1;
        min-width: 0;
    }

    & > *:not(last-child) {
        margin-right: 4px;
    }
}

</style>