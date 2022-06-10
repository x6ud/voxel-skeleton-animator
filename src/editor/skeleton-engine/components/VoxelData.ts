import {Voxel, Voxels} from '../../utils/voxel/data';
import {gridHash} from '../../utils/voxel/hash';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNode from '../SkeletonModelNode';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';
import Width from './Width';

@registerSkeletonModelComponentDef({
    storable: true,
    cloneable: true,
    flipFunc,
    serializeFunc,
    deserializeFunc,
})
export default class VoxelData extends SkeletonModelNodeComponent<Voxels> {
    value = new Map();
}

function flipFunc(val: Voxels, node: SkeletonModelNode): Voxels {
    const ret: Voxels = new Map();
    const offsetZ = node.getValueOrElse(Width, 0) % 2 ? 0 : 1;
    val.forEach(voxel => {
        const flipped: Voxel = {
            ...voxel,
            z: -voxel.z - offsetZ,
        };
        ret.set(gridHash(flipped.x, flipped.y, flipped.z), flipped);
    });
    return ret;
}

function serializeFunc(val: Voxels): { [index: number]: Voxel } {
    const ret: { [index: number]: Voxel } = {};
    val.forEach((voxel, index) => {
        ret[index] = voxel;
    });
    return ret;
}

function deserializeFunc(val: { [index: number]: Voxel }): Voxels {
    const ret: Voxels = new Map();
    for (let index in val) {
        ret.set(Number(index), val[index]);
    }
    return ret;
}
