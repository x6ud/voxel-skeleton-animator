declare module '*.vue' {
    import {DefineComponent} from 'vue';
    const content: DefineComponent<{}, {}, any>;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.vert' {
    const content: string;
    export default content;
}

declare module '*.frag' {
    const content: string;
    export default content;
}

declare module '*.wav' {
    const content: string;
    export default content;
}

declare module '*.ttf' {
    const content: string;
    export default content;
}

declare module '*.txt' {
    const content: string;
    export default content;
}
