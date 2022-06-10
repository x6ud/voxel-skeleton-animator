import {vec3} from 'gl-matrix';
import {getTriangleNormal} from '../geometry/math';

export type LineVertex = {
    'a_position': number[],
    'a_color': number[],
};

export type FaceVertex = {
    'a_color': number[],
    'a_position': number[],
    'a_normal': number[]
};

export function addTriangleFace(
    vertices: FaceVertex[],
    indices: number[],
    color: [number, number, number, number],
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number]
) {
    const normal: [number, number, number] = [0, 0, 0];
    getTriangleNormal(normal, a, b, c);
    vec3.negate(normal, normal);
    const i = vertices.length;
    vertices.push(
        {'a_color': color, 'a_position': a, 'a_normal': normal},
        {'a_color': color, 'a_position': b, 'a_normal': normal},
        {'a_color': color, 'a_position': c, 'a_normal': normal},
    );
    indices.push(
        i,
        i + 1,
        i + 2
    );
}

export function addQuatFace(
    vertices: FaceVertex[],
    indices: number[],
    color: [number, number, number, number],
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
) {
    addTriangleFace(vertices, indices, color, a, b, c);
    addTriangleFace(vertices, indices, color, a, c, d);
}

export function addCylinderXAxis(
    vertices: FaceVertex[], indices: number[], color: [number, number, number, number],
    x0: number, x1: number, radius: number, seg: number
) {
    const detAngle = Math.PI * 2 / seg;
    const cos = Math.cos(detAngle);
    const sin = Math.sin(detAngle);
    let y0 = 0;
    let z0 = radius;
    for (let i = 0; i < seg; ++i) {
        const y1 = y0 * cos - z0 * sin;
        const z1 = y0 * sin + z0 * cos;
        addTriangleFace(
            vertices, indices, color,
            [x0, 0, 0],
            [x0, y1, z1],
            [x0, y0, z0],
        );
        addTriangleFace(
            vertices, indices, color,
            [x1, 0, 0],
            [x1, y0, z0],
            [x1, y1, z1],
        );
        addQuatFace(
            vertices, indices, color,
            [x1, y1, z1],
            [x1, y0, z0],
            [x0, y0, z0],
            [x0, y1, z1],
        );
        y0 = y1;
        z0 = z1;
    }
}

export function addConeXAxis(
    vertices: FaceVertex[], indices: number[], color: [number, number, number, number],
    x0: number, x1: number, radius: number, seg: number
) {
    const detAngle = Math.PI * 2 / seg;
    const cos = Math.cos(detAngle);
    const sin = Math.sin(detAngle);
    let y0 = 0;
    let z0 = radius;
    {
        const cos = Math.cos(detAngle / 2);
        const sin = Math.sin(detAngle / 2);
        const y1 = y0 * cos - z0 * sin;
        const z1 = y0 * sin + z0 * cos;
        y0 = y1;
        z0 = z1;
    }
    for (let i = 0; i < seg; ++i) {
        const y1 = y0 * cos - z0 * sin;
        const z1 = y0 * sin + z0 * cos;
        addTriangleFace(
            vertices, indices, color,
            [x0, 0, 0],
            [x0, y1, z1],
            [x0, y0, z0],
        );
        addTriangleFace(
            vertices, indices, color,
            [x1, 0, 0],
            [x0, y0, z0],
            [x0, y1, z1],
        );
        y0 = y1;
        z0 = z1;
    }
}
