import {ReadonlyVec3, vec3} from 'gl-matrix';

export function raycastVoxel(
    result: vec3,
    isVoxelExists: (x: number, y: number, z: number) => boolean,
    ray0: ReadonlyVec3,
    ray1: ReadonlyVec3,
    maxDistance: number = 0,
    hitPosition?: vec3,
    hitNormal?: vec3
) {
    const px = ray0[0];
    const py = ray0[1];
    const pz = ray0[2];
    const detX = ray1[0] - px;
    const detY = ray1[1] - py;
    const detZ = ray1[2] - pz;
    const len = Math.sqrt(detX ** 2 + detY ** 2 + detZ ** 2);
    const dx = detX / len;
    const dy = detY / len;
    const dz = detZ / len;
    let t = 0;
    let ix = Math.floor(px);
    let iy = Math.floor(py);
    let iz = Math.floor(pz);
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;
    const detTx = Math.abs(1 / dx);
    const detTy = Math.abs(1 / dy);
    const detTz = Math.abs(1 / dz);
    let nextX = detTx < Infinity ? detTx * (stepX > 0 ? ix + 1 - px : px - ix) : Infinity;
    let nextY = detTy < Infinity ? detTy * (stepY > 0 ? iy + 1 - py : py - iy) : Infinity;
    let nextZ = detTz < Infinity ? detTz * (stepZ > 0 ? iz + 1 - pz : pz - iz) : Infinity;
    let face = -1;
    if (maxDistance <= 0) {
        maxDistance = len;
    }
    while (t < maxDistance) {
        if (isVoxelExists(ix, iy, iz)) {
            vec3.set(result, ix, iy, iz);
            if (hitPosition) {
                vec3.set(hitPosition, px + t * dx, py + t * dy, pz + t * dz);
            }
            if (hitNormal) {
                let nx = 0;
                let ny = 0;
                let nz = 0;
                switch (face) {
                    case 0:
                        nx = -stepX;
                        break;
                    case 1:
                        ny = -stepY;
                        break;
                    case 2:
                        nz = -stepZ;
                        break;
                }
                vec3.set(hitNormal, nx, ny, nz);
            }
            return true;
        }
        if (nextX < nextY) {
            if (nextX < nextZ) {
                ix += stepX;
                t = nextX;
                nextX += detTx;
                face = 0;
            } else {
                iz += stepZ;
                t = nextZ;
                nextZ += detTz;
                face = 2;
            }
        } else {
            if (nextY < nextZ) {
                iy += stepY;
                t = nextY;
                nextY += detTy;
                face = 1;
            } else {
                iz += stepZ;
                t = nextZ;
                nextZ += detTz;
                face = 2;
            }
        }
    }
    return false;
}
