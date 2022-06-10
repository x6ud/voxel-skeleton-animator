import {ReadonlyVec2, ReadonlyVec3, ReadonlyVec4} from 'gl-matrix';

export function setBufferXY(buffer: Float32Array, index: number, x: number, y: number) {
    const offset = index * 2;
    buffer[offset] = x;
    buffer[offset + 1] = y;
}

export function setBufferXYZ(buffer: Float32Array, index: number, x: number, y: number, z: number) {
    const offset = index * 3;
    buffer[offset] = x;
    buffer[offset + 1] = y;
    buffer[offset + 2] = z;
}

export function setBufferXYZW(buffer: Float32Array, index: number, x: number, y: number, z: number, w: number) {
    const offset = index * 4;
    buffer[offset] = x;
    buffer[offset + 1] = y;
    buffer[offset + 2] = z;
    buffer[offset + 3] = w;
}

export function setBufferVec2(buffer: Float32Array, index: number, vec: ReadonlyVec2) {
    setBufferXY(buffer, index, vec[0], vec[1]);
}

export function setBufferVec3(buffer: Float32Array, index: number, vec: ReadonlyVec3) {
    setBufferXYZ(buffer, index, vec[0], vec[1], vec[2]);
}

export function setBufferVec4(buffer: Float32Array, index: number, vec: ReadonlyVec4) {
    setBufferXYZW(buffer, index, vec[0], vec[1], vec[2], vec[3]);
}

export function setBufferVec4FromNum(buffer: Float32Array, index: number, num: number) {
    setBufferXYZW(
        buffer,
        index,
        ((num >>> 0) & 0xff) / 0xff,
        ((num >>> 8) & 0xff) / 0xff,
        ((num >>> 16) & 0xff) / 0xff,
        ((num >>> 24) & 0xff) / 0xff,
    );
}

export function setBufferRgba(buffer: Uint8Array, bufferWidth: number, x: number, y: number, r: number, g: number, b: number, a: number) {
    const i = 4 * (bufferWidth * y + x);
    buffer[i] = r;
    buffer[i + 1] = g;
    buffer[i + 2] = b;
    buffer[i + 3] = a;
}
