import {gridHash} from './hash';

export type Voxel = { x: number, y: number, z: number, color: number };
export type Voxels = Map<number, Voxel>;

export function setVoxel(voxels: Voxels, x: number, y: number, z: number, color: number | null): boolean {
    const hash = gridHash(x, y, z);
    const curr = voxels.get(hash);
    if (color == null) {
        if (curr == null) {
            return false;
        }
        voxels.delete(hash);
        return true;
    } else {
        if (curr?.color === color) {
            return false;
        }
        voxels.set(hash, {x, y, z, color});
        return true;
    }
}

export function getVoxel(voxels: Voxels, x: number, y: number, z: number): number | null {
    const voxel = voxels.get(gridHash(x, y, z));
    return voxel ? voxel.color : null;
}

export function voxelTranslate(voxels: Voxels, dx: number, dy: number, dz: number): Voxels {
    dx = Math.round(dx);
    dy = Math.round(dy);
    dz = Math.round(dz);
    const ret: Voxels = new Map();
    voxels.forEach(voxel => {
        const x = voxel.x + dx;
        const y = voxel.y + dy;
        const z = voxel.z + dz;
        const hash = gridHash(x, y, z);
        ret.set(gridHash(x, y, z), {x, y, z, color: voxel.color});
    });
    return ret;
}