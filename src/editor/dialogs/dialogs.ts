import {createComponentInstance} from '../utils/component';
import {saves} from '../utils/saves';
import ConfirmDialog from './ConfirmDialog.vue';
import OpenDialog from './OpenDialog.vue';
import PromptDialog from './PromptDialog.vue';
import SaveAsDialog from './SaveAsDialog.vue';

// =========================== confirm ===========================

export class ConfirmDialogContext {
    visible: boolean;
    content: string;
    onCloseCallback: (b: boolean) => void;

    constructor(visible: boolean, content: string, onCloseCallback: (b: boolean) => void) {
        this.visible = visible;
        this.content = content;
        this.onCloseCallback = onCloseCallback;
    }
}

export function showConfirmDialog(content: string): Promise<boolean> {
    let unmount: () => void;
    return new Promise<boolean>(function (resolve) {
        const context = new ConfirmDialogContext(
            true,
            content,
            function (b) {
                unmount();
                resolve(b);
            }
        );
        unmount = createComponentInstance(ConfirmDialog, app => {
            app.provide('context', context);
        });
    });
}

// =========================== prompt ===========================

export class PromptDialogContext {
    visible: boolean;
    title: string;
    value: string | null;
    onCloseCallback: (val: string | null) => void;

    constructor(visible: boolean, title: string, value: string | null, onCloseCallback: (val: string | null) => void) {
        this.visible = visible;
        this.title = title;
        this.value = value;
        this.onCloseCallback = onCloseCallback;
    }
}

export function showPromptDialog(title: string, value?: string): Promise<string | null> {
    let unmount: () => void;
    return new Promise<string | null>(function (resolve) {
        const context = new PromptDialogContext(
            true,
            title,
            value == null ? null : value,
            function (val) {
                unmount();
                resolve(val);
            }
        );
        unmount = createComponentInstance(PromptDialog, app => {
            app.provide('context', context);
        });
    });
}

// =========================== save as ===========================

export class SaveAsDialogContext {
    visible: boolean;
    filename: string | null;
    files: string[];
    onCloseCallback: (filename: string | null) => void;

    constructor(visible: boolean,
                filename: string | null,
                list: string[],
                onCloseCallback: (filename: (string | null)) => void
    ) {
        this.visible = visible;
        this.filename = filename;
        this.files = list;
        this.onCloseCallback = onCloseCallback;
    }
}

export function showSaveAsDialog(
    dir: string,
    filename: string | null,
    ext: string = '.zip'
): Promise<string | null> {
    let unmount: () => void;
    return new Promise<string | null>(async function (resolve) {
        const context = new SaveAsDialogContext(
            true,
            filename,
            (await saves.dir(dir))
                .filter(filename => filename.endsWith(ext))
                .map(filename => filename.substr(0, filename.length - ext.length)),
            function (filename) {
                unmount();
                resolve(filename);
            });
        unmount = createComponentInstance(SaveAsDialog, app => {
            app.provide('context', context);
        });
    });
}

// =========================== open ===========================

export class OpenDialogContext {
    visible: boolean;
    files: string[];
    onCloseCallback: (filename: string | null) => void;

    constructor(visible: boolean, files: string[], onCloseCallback: (filename: (string | null)) => void) {
        this.visible = visible;
        this.files = files;
        this.onCloseCallback = onCloseCallback;
    }
}

export function showOpenDialog(dir: string, ext: string = '.zip') {
    let unmount: () => void;
    return new Promise<string | null>(async function (resolve) {
        const context = new OpenDialogContext(
            true,
            (await saves.dir(dir))
                .filter(filename => filename.endsWith(ext))
                .map(filename => filename.substr(0, filename.length - ext.length)),
            function (filename) {
                unmount();
                resolve(filename);
            });
        unmount = createComponentInstance(OpenDialog, app => {
            app.provide('context', context);
        });
    });
}