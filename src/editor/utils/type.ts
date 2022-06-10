type MatchedPropertiesNames<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
export type MatchedProperties<T, U> = Pick<T, MatchedPropertiesNames<T, U>>;

type UnmatchedPropertiesNames<T, U> = { [K in keyof T]: T[K] extends U ? never : K }[keyof T];
export type UnmatchedProperties<T, U> = Pick<T, UnmatchedPropertiesNames<T, U>>;

type PublicPropertiesNames<T> = { [K in keyof T]: (K extends `_${string}` ? never : K) }[keyof T];
export type PublicProperties<T> = Pick<T, PublicPropertiesNames<T>>;

export type SerializablePrimitiveValue =
    string
    | number
    | boolean
    | null
    | Uint8Array
    | SerializablePrimitiveValue[]
    | { [key: string]: SerializablePrimitiveValue };

type SerializableKeyValueObject<T> = T extends { [key: string]: any } ? { [K in keyof T]: SerializableObject<T[K]> } : never;
export type SerializableObject<T> =
    T extends SerializablePrimitiveValue ? T :
        T extends (infer Elem)[] ? SerializableObject<Elem>[] :
            T extends { [key: string]: any } ? SerializableKeyValueObject<UnmatchedProperties<PublicProperties<T>, Function>>
                : never;

export type JsonPrimitiveValue =
    string
    | number
    | boolean
    | null
    | JsonPrimitiveValue[]
    | { [key: string]: JsonPrimitiveValue };

type JsonKeyValueObject<T> = T extends { [key: string]: any } ? { [K in keyof T]: JsonObject<T[K]> } : never;
export type JsonObject<T> =
    T extends ArrayBufferLike ? never : (
        T extends JsonPrimitiveValue ? T :
            T extends (infer Elem)[] ? JsonObject<Elem>[] :
                T extends { [key: string]: any } ? JsonKeyValueObject<UnmatchedProperties<PublicProperties<T>, Function>>
                    : never
        );