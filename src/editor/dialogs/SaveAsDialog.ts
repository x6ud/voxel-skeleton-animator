import {defineComponent, inject, ref, watch} from 'vue';
import PopupDialog from '../components/popup/PopupDialog/PopupDialog.vue';
import {SaveAsDialogContext, showConfirmDialog} from './dialogs';

export default defineComponent({
    components: {PopupDialog},
    setup() {
        const visible = ref(false);
        const filename = ref<string | null>(null);
        const files = ref<string[]>([]);
        let saveConfirmed = false;

        const context = inject<SaveAsDialogContext | null>('context', null);
        if (context) {
            visible.value = context.visible;
            filename.value = context.filename;
            files.value = context.files;
        }

        watch(visible, visible => {
            if (!visible) {
                context?.onCloseCallback(saveConfirmed ? filename.value : null);
            }
        });

        async function save() {
            filename.value = filename.value?.trim() || null;
            if (!filename.value) {
                return;
            }
            if (files.value.includes(filename.value)) {
                if (await showConfirmDialog(`"${filename.value}" already existed. Do you want to replace it?`)) {
                    saveConfirmed = true;
                    visible.value = false;
                }
            } else {
                saveConfirmed = true;
                visible.value = false;
            }
        }

        function cancel() {
            visible.value = false;
        }

        return {
            files,
            visible,
            filename,
            save,
            cancel,
        };
    }
});