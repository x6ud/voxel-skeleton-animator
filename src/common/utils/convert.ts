export function uint16ArrayToUint8Array(array: Uint16Array): Uint8Array {
    const ret = new Uint8Array(array.length * 2);
    for (let i = 0; i < array.length; ++i) {
        const uint32 = array[i];
        const j = i * 2;
        ret[j] = (uint32 >>> 8) & 0xff;
        ret[j + 1] = uint32 & 0xff;
    }
    return ret;
}

export function uint8ArrayToUint16Array(array: Uint8Array): Uint16Array {
    const ret = new Uint16Array(array.length / 2);
    for (let i = 0; i < array.length; i += 2) {
        ret[i / 2] = array[i] * (1 << 8) + array[i + 1];
    }
    return ret;
}

export function uint32ArrayToUint8Array(array: Uint32Array): Uint8Array {
    const ret = new Uint8Array(array.length * 4);
    for (let i = 0; i < array.length; ++i) {
        const uint32 = array[i];
        const j = i * 4;
        ret[j] = (uint32 >>> 24) & 0xff;
        ret[j + 1] = (uint32 >>> 16) & 0xff;
        ret[j + 2] = (uint32 >>> 8) & 0xff;
        ret[j + 3] = uint32 & 0xff;
    }
    return ret;
}

export function uint8ArrayToUint32Array(array: Uint8Array): Uint32Array {
    const ret = new Uint32Array(array.length / 4);
    for (let i = 0; i < array.length; i += 4) {
        ret[i / 4] = array[i] * (1 << 24)
            + array[i + 1] * (1 << 16)
            + array[i + 2] * (1 << 8)
            + array[i + 3];
    }
    return ret;
}

export function uint32ToUint8Array(num: number): Uint8Array {
    const ret = new Uint8Array(4);
    ret[0] = (num >>> 24) & 0xff;
    ret[1] = (num >>> 16) & 0xff;
    ret[2] = (num >>> 8) & 0xff;
    ret[3] = num & 0xff;
    return ret;
}

export function uint8ArrayToUint32(array: Uint8Array): number {
    return array[0] * (1 << 24)
        + array[1] * (1 << 16)
        + array[2] * (1 << 8)
        + array[3];
}

export function int32ToUint32(num: number): number {
    return num < 0 ? ((0x80000000 | (-num) & 0x7FFFFFFF) >>> 0) : num;
}

export function uint32ToInt32(num: number): number {
    return num > 0x7FFFFFFF ? -((num & 0x7FFFFFFF) >>> 0) : num;
}

export function int32ArrayToUint8Array(array: Int32Array): Uint8Array {
    const ret = new Uint8Array(array.length * 4);
    for (let i = 0; i < array.length; ++i) {
        const uint32 = int32ToUint32(array[i]);
        const j = i * 4;
        ret[j] = (uint32 >>> 24) & 0xff;
        ret[j + 1] = (uint32 >>> 16) & 0xff;
        ret[j + 2] = (uint32 >>> 8) & 0xff;
        ret[j + 3] = uint32 & 0xff;
    }
    return ret;
}

export function uint8ArrayToInt32Array(array: Uint8Array): Int32Array {
    const ret = new Int32Array(array.length / 4);
    for (let i = 0; i < array.length; i += 4) {
        ret[i / 4] = uint32ToInt32(
            array[i] * (1 << 24)
            + array[i + 1] * (1 << 16)
            + array[i + 2] * (1 << 8)
            + array[i + 3]
        );
    }
    return ret;
}
