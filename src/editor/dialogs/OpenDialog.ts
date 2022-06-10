import {defineComponent, inject, ref, watch} from 'vue';
import PopupDialog from '../components/popup/PopupDialog/PopupDialog.vue';
import {OpenDialogContext} from './dialogs';

export default defineComponent({
    components: {PopupDialog},
    setup() {
        const visible = ref(false);
        const filename = ref<string | null>(null);
        const files = ref<string[]>([]);

        const context = inject<OpenDialogContext | null>('context', null);
        if (context) {
            visible.value = context.visible;
            files.value = context.files;
        }

        watch(visible, visible => {
            if (!visible) {
                context?.onCloseCallback(filename.value);
            }
        });

        return {
            files,
            visible,
            filename,
        };
    }
});