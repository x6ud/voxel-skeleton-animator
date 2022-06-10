import SkeletonAnimationKeyframe from './SkeletonAnimationKeyframe';

export default class SkeletonAnimation {
    id: number = 0;
    name: string = '';
    frameDuration: number = 33;
    keyframes: SkeletonAnimationKeyframe[] = [];
}
