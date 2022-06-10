import {JsonObject, SerializableObject} from './type';

export function cloneSerializable<T,
    I extends (undefined | (keyof T)[]),
    R extends (I extends undefined ? SerializableObject<T> : Exclude<SerializableObject<T>, I>)>
(obj: T, ignoreProperties?: I): R {
    if (typeof obj !== 'object' || !obj) {
        return obj as R;
    }
    if (Array.isArray(obj)) {
        return obj.map((elem: any) => cloneSerializable(elem)) as R;
    }
    const ret = {} as { [key: string]: any };
    for (let key in obj) {
        if (key.startsWith('_')) {
            continue;
        }
        if (ignoreProperties && ignoreProperties.includes(key)) {
            continue;
        }
        if ((obj as { [key: string]: any }).hasOwnProperty(key)) {
            const val = obj[key];
            if (typeof val === 'object') {
                if (val instanceof Uint8Array) {
                    ret[key] = val.slice();
                } else if (Array.isArray(val)) {
                    ret[key] = val.map((elem: any) => cloneSerializable(elem));
                } else {
                    ret[key] = cloneSerializable(val);
                }
            } else {
                ret[key] = val;
            }
        }
    }
    return ret as R;
}

export function cloneSerializablePartial<T extends { [key: string]: any }>(target: T, properties: Partial<T>): Partial<T> {
    const ret = {} as Partial<T>;
    for (let key in properties) {
        if (properties.hasOwnProperty(key) && target.hasOwnProperty(key)) {
            const val = target[key];
            if (typeof val === 'object') {
                if ((val as Object) instanceof Uint8Array) {
                    ret[key] = val.slice();
                } else if (Array.isArray(val)) {
                    ret[key] = val.map((elem: any) => cloneSerializable(elem));
                } else {
                    ret[key] = cloneSerializable(val);
                }
            } else {
                ret[key] = val;
            }
        }
    }
    return ret;
}

export function cloneJson<T>(obj: T): JsonObject<T> {
    if (typeof obj !== 'object' || !obj) {
        return obj as JsonObject<T>;
    }
    if (Array.isArray(obj)) {
        return obj.map(cloneJson) as JsonObject<T>;
    }
    const ret = {} as { [key: string]: any };
    for (let key in obj) {
        if (key.startsWith('_')) {
            continue;
        }
        if ((obj as { [key: string]: any }).hasOwnProperty(key)) {
            const val = obj[key];
            if (typeof val === 'object') {
                if (ArrayBuffer.isView(val)) {
                    // ignore
                } else if (Array.isArray(val)) {
                    ret[key] = val.map(cloneJson);
                } else {
                    ret[key] = cloneJson(val);
                }
            } else {
                ret[key] = val;
            }
        }
    }
    return ret as JsonObject<T>;
}