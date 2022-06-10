import {showConfirmDialog} from '../dialogs/dialogs';

class HistoryRecord {
    undo: (merging?: boolean) => void;
    redo: () => void;
    post: null | (() => void);
    name: string;

    constructor(undo: () => void,
                redo: () => void,
                post: null | (() => void),
                name: string
    ) {
        this.undo = undo;
        this.redo = redo;
        this.post = post;
        this.name = name;
    }
}

export default class EditorHistory {

    private maxStackSize = 200;
    private dirty = false;
    private undoStack: Array<HistoryRecord> = [];
    private redoStack: Array<HistoryRecord> = [];
    private lastEventTarget: EventTarget | null = null;
    private enableMergeInNextAction = true;

    private readonly onMouseDown: (e: MouseEvent) => void;
    private readonly onKeyDown: (e: KeyboardEvent) => void;

    onDirtyChange?: (dirty: boolean) => void;

    constructor() {
        this.onMouseDown = (e: MouseEvent) => {
            this.lastEventTarget = e.target;
            this.enableMergeInNextAction = false;
        };
        this.onKeyDown = (e: KeyboardEvent) => {
            if (this.lastEventTarget !== e.target) {
                this.lastEventTarget = e.target;
                this.enableMergeInNextAction = false;
            }
        };
    }

    setup() {
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('keydown', this.onKeyDown);
    }

    unload() {
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('keydown', this.onKeyDown);
    }

    private setDirty(dirty: boolean) {
        if (dirty === this.dirty) {
            return;
        }
        this.dirty = dirty;
        this.onDirtyChange && this.onDirtyChange(dirty);
    }

    undo(cancel: boolean = false) {
        const record = this.undoStack.pop();
        if (!record) {
            return;
        }
        if (!cancel) {
            this.redoStack.push(record);
        }
        record.undo();
        record.post && record.post();
        this.setDirty(true);
    }

    redo() {
        const record = this.redoStack.pop();
        if (!record) {
            return;
        }
        this.undoStack.push(record);
        record.redo();
        record.post && record.post();
        this.setDirty(true);
    }

    applyAndRecord<T>(pre: null | ((prevRecordUndoReturnValue: T | undefined) => void),
                      action: () => void,
                      undo: (merging?: boolean) => T,
                      post: null | (() => void),
                      name: string,
                      merge: boolean = false,
    ) {
        this.record(pre, action, undo, post, name, merge, true);
    }

    record<T>(pre: null | ((prevRecordUndoReturnValue: T | undefined) => void),
              redo: () => void,
              undo: (merging?: boolean) => T,
              post: null | (() => void),
              name: string,
              merge: boolean = false,
              apply: boolean = false
    ) {
        let ctx: T | undefined;
        if (name && this.undoStack.length && merge && this.enableMergeInNextAction) {
            const oldRecord = this.undoStack[this.undoStack.length - 1];
            if (oldRecord.name === name) {
                ctx = this.undoStack.pop()?.undo(true) as (T | undefined);
            }
        }
        pre && pre(ctx);
        if (apply) {
            redo();
        }
        post && post();
        this.enableMergeInNextAction = true;
        this.undoStack.push(new HistoryRecord(undo, redo, post || null, name));
        if (this.undoStack.length >= this.maxStackSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this.setDirty(true);
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.setDirty(false);
    }

    saved() {
        this.setDirty(false);
    }

    async confirm() {
        if (this.dirty) {
            return showConfirmDialog('Unsaved changes will be lost.\nAre you sure you want to continue?');
        }
        return true;
    }

}
