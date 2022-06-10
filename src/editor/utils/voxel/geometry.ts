import {toRaw} from 'vue';
import Color from '../../../common/utils/Color';
import {Voxels} from './data';
import {faceHash, gridHash} from './hash';

export const enum FaceSide {
    LEFT, RIGHT, TOP, BOTTOM, FRONT, BACK
}

export class VoxelFace {
    x: number;
    y: number;
    z: number;
    side: FaceSide;
    width: number = 1;
    height: number = 1;
    color: number;

    constructor(x: number, y: number, z: number, side: FaceSide, color: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.side = side;
        this.color = color;
    }
}

function isFaceVisible(voxels: Voxels,
                       x: number, y: number, z: number,
                       face: FaceSide
) {
    switch (face) {
        case FaceSide.LEFT:
            x -= 1;
            break;
        case FaceSide.RIGHT:
            x += 1;
            break;
        case FaceSide.TOP:
            y += 1;
            break;
        case FaceSide.BOTTOM:
            y -= 1;
            break;
        case FaceSide.FRONT:
            z += 1;
            break;
        case FaceSide.BACK:
            z -= 1;
            break;
    }
    const hash = gridHash(x, y, z);
    return !voxels.has(hash);
}

export function getVisibleFaces(voxels: Voxels): Map<number, VoxelFace> {
    const faces: Map<number, VoxelFace> = new Map<number, VoxelFace>();
    voxels.forEach(voxel => {
        voxel = toRaw(voxel);
        const x = voxel.x;
        const y = voxel.y;
        const z = voxel.z;
        for (let faceSide = 0; faceSide < 6; ++faceSide) {
            if (isFaceVisible(voxels, x, y, z, faceSide)) {
                faces.set(faceHash(x, y, z, faceSide), new VoxelFace(x, y, z, faceSide, voxel.color));
            }
        }
    });
    return faces;
}

type EdgeVertex = { 'a_position': number[], 'a_color': number[] };

export function createEdgeVertices(faces: Map<number, VoxelFace>,
                                   color: number[],
                                   offsetX: number,
                                   offsetY: number,
                                   offsetZ: number,
) {
    const vertices: EdgeVertex[] = [];
    const indices: number[] = [];
    faces.forEach(face => {
        let v0: number[];
        let v1: number[];
        let v2: number[];
        let v3: number[];
        switch (face.side) {
            case FaceSide.LEFT:
                v0 = [face.x, face.y, face.z];
                v1 = [face.x, face.y, face.z + face.width];
                v2 = [face.x, face.y + face.height, face.z + face.width];
                v3 = [face.x, face.y + face.height, face.z];
                break;
            case FaceSide.RIGHT:
                v0 = [face.x + 1, face.y, face.z + face.width];
                v1 = [face.x + 1, face.y, face.z];
                v2 = [face.x + 1, face.y + face.height, face.z];
                v3 = [face.x + 1, face.y + face.height, face.z + face.width];
                break;
            case FaceSide.TOP:
                v0 = [face.x, face.y + 1, face.z + face.height];
                v1 = [face.x + face.width, face.y + 1, face.z + face.height];
                v2 = [face.x + face.width, face.y + 1, face.z];
                v3 = [face.x, face.y + 1, face.z];
                break;
            case FaceSide.BOTTOM:
                v0 = [face.x, face.y, face.z];
                v1 = [face.x + face.width, face.y, face.z];
                v2 = [face.x + face.width, face.y, face.z + face.height];
                v3 = [face.x, face.y, face.z + face.height];
                break;
            case FaceSide.FRONT:
                v0 = [face.x, face.y, face.z + 1];
                v1 = [face.x + face.width, face.y, face.z + 1];
                v2 = [face.x + face.width, face.y + face.height, face.z + 1];
                v3 = [face.x, face.y + face.height, face.z + 1];
                break;
            case FaceSide.BACK:
                v0 = [face.x + face.width, face.y, face.z];
                v1 = [face.x, face.y, face.z];
                v2 = [face.x, face.y + face.height, face.z];
                v3 = [face.x + face.width, face.y + face.height, face.z];
                break;
        }
        const index = vertices.length;
        vertices.push({['a_position']: v0, ['a_color']: color});
        vertices.push({['a_position']: v1, ['a_color']: color});
        vertices.push({['a_position']: v2, ['a_color']: color});
        vertices.push({['a_position']: v3, ['a_color']: color});
        indices.push(
            index, index + 1,
            index + 1, index + 2,
            index + 2, index + 3,
            index + 3, index
        );
    });
    for (let vertex of vertices) {
        const position = vertex['a_position'];
        position[0] += offsetX;
        position[1] += offsetY;
        position[2] += offsetZ;
    }
    return {vertices, indices};
}

export function mergeFaces(faces: Map<number, VoxelFace>) {
    // merge horizontally
    for (let iter = faces.entries(), next = iter.next(); !next.done; next = iter.next()) {
        const hash1 = next.value[0];
        const face1 = next.value[1];
        let hx: number;
        let hy: number;
        let hz: number;
        switch (face1.side) {
            case FaceSide.LEFT:
            case FaceSide.RIGHT:
                hx = 0;
                hy = 0;
                hz = 1;
                break;
            case FaceSide.TOP:
            case FaceSide.BOTTOM:
                hx = 1;
                hy = 0;
                hz = 0;
                break;
            case FaceSide.FRONT:
            case FaceSide.BACK:
                hx = 1;
                hy = 0;
                hz = 0;
                break;
            default:
                throw new Error('Invalid side');
        }
        const hash2 = faceHash(face1.x + hx * face1.width, face1.y + hy * face1.width, face1.z + hz * face1.width, face1.side);
        const face2 = faces.get(hash2);
        if (face2 && face1.height === face2.height && face1.color.valueOf() === face2.color.valueOf()) {
            faces.delete(hash1);
            faces.delete(hash2);
            face1.width += face2.width;
            faces.set(hash1, face1);
        }
    }
    // merge vertically
    for (let iter = faces.entries(), next = iter.next(); !next.done; next = iter.next()) {
        const hash1 = next.value[0];
        const face1 = next.value[1];
        let vx: number;
        let vy: number;
        let vz: number;
        switch (face1.side) {
            case FaceSide.LEFT:
            case FaceSide.RIGHT:
                vx = 0;
                vy = 1;
                vz = 0;
                break;
            case FaceSide.TOP:
            case FaceSide.BOTTOM:
                vx = 0;
                vy = 0;
                vz = 1;
                break;
            case FaceSide.FRONT:
            case FaceSide.BACK:
                vx = 0;
                vy = 1;
                vz = 0;
                break;
            default:
                throw new Error('Invalid side');
        }
        const hash2 = faceHash(face1.x + vx * face1.height, face1.y + vy * face1.height, face1.z + vz * face1.height, face1.side);
        const face2 = faces.get(hash2);
        if (face2 && face1.width === face2.width && face1.color.valueOf() === face2.color.valueOf()) {
            faces.delete(hash1);
            faces.delete(hash2);
            face1.height += face2.height;
            faces.set(hash1, face1);
        }
    }
}

type FaceVertex = { ['a_position']: number[], ['a_normal']: number[], ['a_color']: number[] };

export function createFaceVertices(faces: Map<number, VoxelFace>,
                                   offsetX: number,
                                   offsetY: number,
                                   offsetZ: number,
) {
    const vertices: FaceVertex[] = [];
    const indices: number[] = [];
    faces.forEach(face => {
        const color = Color.parse(face.color);
        const colorArr = [color.r / 0xff, color.g / 0xff, color.b / 0xff, 1.0];
        let normal: number[];
        let v0: number[];
        let v1: number[];
        let v2: number[];
        let v3: number[];
        switch (face.side) {
            case FaceSide.LEFT:
                normal = [-1, 0, 0];
                v0 = [face.x, face.y, face.z];
                v1 = [face.x, face.y, face.z + face.width];
                v2 = [face.x, face.y + face.height, face.z + face.width];
                v3 = [face.x, face.y + face.height, face.z];
                break;
            case FaceSide.RIGHT:
                normal = [1, 0, 0];
                v0 = [face.x + 1, face.y, face.z + face.width];
                v1 = [face.x + 1, face.y, face.z];
                v2 = [face.x + 1, face.y + face.height, face.z];
                v3 = [face.x + 1, face.y + face.height, face.z + face.width];
                break;
            case FaceSide.TOP:
                normal = [0, 1, 0];
                v0 = [face.x, face.y + 1, face.z + face.height];
                v1 = [face.x + face.width, face.y + 1, face.z + face.height];
                v2 = [face.x + face.width, face.y + 1, face.z];
                v3 = [face.x, face.y + 1, face.z];
                break;
            case FaceSide.BOTTOM:
                normal = [0, -1, 0];
                v0 = [face.x, face.y, face.z];
                v1 = [face.x + face.width, face.y, face.z];
                v2 = [face.x + face.width, face.y, face.z + face.height];
                v3 = [face.x, face.y, face.z + face.height];
                break;
            case FaceSide.FRONT:
                normal = [0, 0, 1];
                v0 = [face.x, face.y, face.z + 1];
                v1 = [face.x + face.width, face.y, face.z + 1];
                v2 = [face.x + face.width, face.y + face.height, face.z + 1];
                v3 = [face.x, face.y + face.height, face.z + 1];
                break;
            case FaceSide.BACK:
                normal = [0, 0, -1];
                v0 = [face.x + face.width, face.y, face.z];
                v1 = [face.x, face.y, face.z];
                v2 = [face.x, face.y + face.height, face.z];
                v3 = [face.x + face.width, face.y + face.height, face.z];
                break;
        }
        const index = vertices.length;
        vertices.push({['a_position']: v0, ['a_normal']: normal, ['a_color']: colorArr});
        vertices.push({['a_position']: v1, ['a_normal']: normal, ['a_color']: colorArr});
        vertices.push({['a_position']: v2, ['a_normal']: normal, ['a_color']: colorArr});
        vertices.push({['a_position']: v3, ['a_normal']: normal, ['a_color']: colorArr});
        indices.push(
            index, index + 1, index + 2,
            index, index + 2, index + 3
        );
    });
    for (let vertex of vertices) {
        const position = vertex['a_position'];
        position[0] += offsetX;
        position[1] += offsetY;
        position[2] += offsetZ;
    }
    return {vertices, indices};
}