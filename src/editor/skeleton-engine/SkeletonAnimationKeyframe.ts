export default class SkeletonAnimationKeyframe {
    time: number;
    readonly nodeId: number;
    readonly component: string;
    readonly hash: string;
    value: any;

    constructor(time: number, nodeId: number, component: string) {
        this.time = time;
        this.nodeId = nodeId;
        this.component = component;
        this.hash = `${nodeId}#${component}`;
    }
}