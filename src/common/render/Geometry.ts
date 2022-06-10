class Attribute {
    name: string;
    componentSize: number;
    vertices: Float32Array;
    vbo?: WebGLBuffer;

    constructor(name: string, componentSize: number, vertices: Float32Array) {
        this.name = name;
        this.componentSize = componentSize;
        this.vertices = vertices;
    }
}

enum PrimitiveType {
    TRIANGLES, LINES
}

export default class Geometry {

    static readonly Attribute = Attribute;
    static readonly TYPE_TRIANGLES = PrimitiveType.TRIANGLES;
    static readonly TYPE_LINES = PrimitiveType.LINES;

    type: PrimitiveType;
    dynamic: boolean;
    attributes: Attribute[] = [];
    private _indices: Uint16Array = new Uint16Array();
    ibo?: WebGLBuffer;
    vao?: WebGLVertexArrayObject;

    constructor(type: PrimitiveType = PrimitiveType.TRIANGLES, dynamic: boolean = false) {
        this.type = type;
        this.dynamic = dynamic;
    }

    setVertices(vertices: { [name: string]: number[] }[]) {
        const len = vertices.length;
        const attributes: { [name: string]: Attribute } = {};
        for (let attrName in vertices[0]) {
            if (vertices[0].hasOwnProperty(attrName)) {
                const size = vertices[0][attrName].length;
                attributes[attrName] = new Attribute(
                    attrName,
                    size,
                    new Float32Array(size * len)
                );
            }
        }
        for (let i = 0; i < len; ++i) {
            const vertex = vertices[i];
            for (let attrName in vertex) {
                if (vertex.hasOwnProperty(attrName)) {
                    const pointArr = vertex[attrName];
                    attributes[attrName].vertices.set(pointArr, pointArr.length * i);
                }
            }
        }
        this.attributes = Object.values(attributes);
    }

    get indices(): Uint16Array {
        return this._indices;
    }

    set indices(value: ArrayLike<number>) {
        this._indices = new Uint16Array(value);
    }

}
