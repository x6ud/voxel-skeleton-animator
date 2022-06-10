export const AXIS_MAX = 0b0111_1111_1111_1111;

export function gridHash(x: number, y: number, z: number) {
    if (Math.abs(x) > AXIS_MAX
        || Math.abs(y) > AXIS_MAX
        || Math.abs(z) > AXIS_MAX
    ) {
        throw new Error('Index out of range');
    }
    x = (x < 0 ? (0b1000_0000_0000_0000) : 0) + Math.abs(x);
    y = (y < 0 ? (0b1000_0000_0000_0000) : 0) + Math.abs(y);
    z = (z < 0 ? (0b1000_0000_0000_0000) : 0) + Math.abs(z);
    return x * 2 ** (16 * 2) + y * 2 ** 16 + z;
}

export function faceHash(x: number, y: number, z: number, faceSide: number) {
    return gridHash(x, y, z) * 6 + faceSide;
}

