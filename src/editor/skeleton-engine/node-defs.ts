import Class from '../../common/type/Class';
import SkeletonModelNodeDef from './SkeletonModelNodeDef';

export const skeletonModelNodeDefs: { [name: string]: SkeletonModelNodeDef } = {};

export const skeletonModelValidRoots: SkeletonModelNodeDef[] = [];

export function registerNodeDef(params: { canBeRoot?: boolean } = {}) {
    return function (constructor: Class<SkeletonModelNodeDef>) {
        const nodeDef = skeletonModelNodeDefs[constructor.name] = new constructor();
        if (params.canBeRoot) {
            skeletonModelValidRoots.push(nodeDef);
        }
    };
}