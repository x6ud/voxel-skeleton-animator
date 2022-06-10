import {mat3, quat, ReadonlyQuat, ReadonlyVec3, vec2, vec3} from 'gl-matrix';

export const quatFromTwoUnitVec = (function () {
    const tmp_vert = new Float32Array(3);
    return function (out: quat, from: ReadonlyVec3, to: ReadonlyVec3) {
        const r = vec3.dot(from, to) + 1;
        if (r < 1e-8) {
            if (Math.abs(from[0]) > Math.abs(from[2])) {
                out[0] = -from[1];
                out[1] = from[0];
                out[2] = 0;
                out[3] = 0;
            } else {
                out[0] = 0;
                out[1] = -from[2];
                out[2] = from[1];
                out[3] = 0;
            }
        } else {
            vec3.cross(tmp_vert, from, to);
            out[0] = tmp_vert[0];
            out[1] = tmp_vert[1];
            out[2] = tmp_vert[2];
            out[3] = r;
        }
        return quat.normalize(out, out);
    };
})();

export const quatFromTwoVec = (function () {
    const tmp_a = new Float32Array(3);
    const tmp_b = new Float32Array(3);
    return function (out: quat, from: ReadonlyVec3, to: ReadonlyVec3) {
        vec3.normalize(tmp_a, from);
        vec3.normalize(tmp_b, to);
        return quatFromTwoUnitVec(out, tmp_a, tmp_b);
    };
})();

export const quatFromVec = (function () {
    const unit = new Float32Array([1, 0, 0]);
    return function (out: quat, vec: ReadonlyVec3) {
        return quatFromTwoVec(out, unit, vec);
    };
})();

export const quatDecompose = (function () {
    const r = vec3.create();
    const rotatedTwistAxis = vec3.create();
    const normalizedTwistAxis = vec3.create();
    const swingAxis = vec3.create();
    const p = vec3.create();
    const invTwist = quat.create();
    return function (outSwing: quat, outTwist: quat, q: ReadonlyQuat, twistAxis: ReadonlyVec3) {
        vec3.normalize(normalizedTwistAxis, twistAxis);
        vec3.set(r, q[0], q[1], q[2]);
        if (vec3.sqrLen(r) < 1e-8) {
            vec3.transformQuat(rotatedTwistAxis, normalizedTwistAxis, q);
            vec3.cross(swingAxis, normalizedTwistAxis, rotatedTwistAxis);
            if (vec3.sqrLen(swingAxis) > 1e-8) {
                const swingAngle = vec3.angle(normalizedTwistAxis, rotatedTwistAxis);
                quat.setAxisAngle(outSwing, swingAxis, swingAngle);
            } else {
                quat.identity(outSwing);
            }
            quat.setAxisAngle(outTwist, normalizedTwistAxis, Math.PI);
            return;
        }
        vecProject(p, r, normalizedTwistAxis);
        quat.set(outTwist, p[0], p[1], p[2], q[3]);
        quat.normalize(outTwist, outTwist);
        quat.invert(invTwist, outTwist);
        quat.mul(outSwing, q, invTwist);
    };
})();

export function quatToEuler(out: vec3, q: ReadonlyQuat) {
    const sinRcosP = 2 * (q[3] * q[0] + q[1] * q[2]);
    const cosRcosP = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    out[0] = Math.atan2(sinRcosP, cosRcosP);

    const sinP = 2 * (q[3] * q[1] - q[2] * q[0]);
    if (Math.abs(sinP) >= 1) {
        out[1] = Math.sign(sinP) * Math.PI / 2;
    } else {
        out[1] = Math.asin(sinP);
    }

    const sinYcosP = 2 * (q[3] * q[2] + q[0] * q[1]);
    const cosYcosP = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
    out[2] = Math.atan2(sinYcosP, cosYcosP);

    return out;
}

export const quatFromForwardUp = (function () {
    const tmp_a = new Float32Array(3);
    const tmp_b = new Float32Array(3);
    const tmp_mat3 = mat3.create();
    return function (out: quat, forward: ReadonlyVec3, up: ReadonlyVec3) {
        vec3.cross(tmp_a, up, forward);
        vec3.normalize(tmp_a, tmp_a);
        vec3.cross(tmp_b, forward, tmp_a);

        tmp_mat3[0] = tmp_a[0];
        tmp_mat3[1] = tmp_a[1];
        tmp_mat3[2] = tmp_a[2];

        tmp_mat3[3] = tmp_b[0];
        tmp_mat3[4] = tmp_b[1];
        tmp_mat3[5] = tmp_b[2];

        tmp_mat3[6] = forward[0];
        tmp_mat3[7] = forward[1];
        tmp_mat3[8] = forward[2];

        return quat.fromMat3(out, tmp_mat3);
    };
})();

export const quatFromRightUp = (function () {
    const tmp_forward = vec3.create();
    return function (out: quat, right: ReadonlyVec3, up: ReadonlyVec3) {
        vec3.cross(tmp_forward, right, up);
        vec3.normalize(tmp_forward, tmp_forward);
        return quatFromForwardUp(out, tmp_forward, up);
    };
})();

export function eulerToQuat(out: quat, yaw: number, pitch: number, roll: number) {
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);
    out[0] = sr * cp * cy - cr * sp * sy;
    out[1] = cr * sp * cy + sr * cp * sy;
    out[2] = cr * cp * sy - sr * sp * cy;
    out[3] = cr * cp * cy + sr * sp * sy;
    return out;
}

export function vecProject(out: vec3, vec: ReadonlyVec3, normal: ReadonlyVec3) {
    const sqrMag = vec3.dot(normal, normal);
    if (sqrMag < 1e-8) {
        vec3.set(out, 0, 0, 0);
    } else {
        vec3.scale(out, normal, vec3.dot(vec, normal) / sqrMag);
    }
    return out;
}

export const angleBetweenVectorsOnPlane = (function () {
    const tmp = vec3.create();
    return function (planeNormal: ReadonlyVec3, a: ReadonlyVec3, b: ReadonlyVec3) {
        vec3.cross(tmp, a, b);
        return Math.atan2(vec3.dot(tmp, planeNormal), vec3.dot(a, b));
    };
})();

export function vecScaleAddVecScale(out: vec3, v1: ReadonlyVec3, n1: number, v2: ReadonlyVec3, n2: number) {
    vec3.scale(out, v1, n1);
    vec3.scaleAndAdd(out, out, v2, n2);
    return out;
}

export const getTriangleNormal = (function () {
    const tmp_a = vec3.create();
    const tmp_b = vec3.create();
    return function (out: vec3, v0: ReadonlyVec3, v1: ReadonlyVec3, v2: ReadonlyVec3) {
        vec3.sub(tmp_a, v0, v1);
        vec3.sub(tmp_b, v1, v2);
        vec3.cross(out, tmp_a, tmp_b);
        vec3.normalize(out, out);
        return out;
    };
})();

export function isVec3Zero(vec: ReadonlyVec3) {
    return vec[0] === 0 && vec[1] === 0 && vec[2] === 0;
}

export function getVertical(out: vec3, vec: ReadonlyVec3) {
    if (Math.abs(vec[0]) > Math.abs(vec[2])) {
        out[0] = -vec[1];
        out[1] = vec[0];
        out[2] = 0;
    } else {
        out[0] = 0;
        out[1] = -vec[2];
        out[2] = vec[1];
    }
}

export const getVerticalInDir = (function () {
    const tmp_vec = vec3.create();
    const ZERO = vec3.fromValues(0, 0, 0);
    return function (out: vec3, vec: ReadonlyVec3, dir: ReadonlyVec3) {
        vec3.cross(tmp_vec, vec, dir);
        vec3.normalize(tmp_vec, tmp_vec);
        if (vec3.exactEquals(tmp_vec, ZERO)) {
            getVertical(tmp_vec, vec);
        }
        vec3.cross(out, vec, tmp_vec);
        if (vec3.dot(out, dir) < 0) {
            vec3.negate(out, out);
        }
        vec3.normalize(out, out);
        return out;
    };
})();

export function mirrorVec3(val: ReadonlyVec3): [number, number, number] {
    return [val[0], val[1], -val[2]];
}

export function mirrorQuat(val: ReadonlyQuat): [number, number, number, number] {
    return [val[0], val[1], -val[2], -val[3]];
}

export function interp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function interpVec3(a: ReadonlyVec3, b: ReadonlyVec3, t: number): [number, number, number] {
    return [interp(a[0], b[0], t), interp(a[1], b[1], t), interp(a[2], b[2], t)];
}

export function interpQuat(a: ReadonlyQuat, b: ReadonlyQuat, t: number): [number, number, number, number] {
    // https://github.com/stackgl/gl-quat/blob/master/slerp.js
    let ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];
    let omega: number, cosom: number, sinom: number, scale0: number, scale1: number;
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    if (cosom < 0.0) {
        cosom = -cosom;
        bx = -bx;
        by = -by;
        bz = -bz;
        bw = -bw;
    }
    if ((1.0 - cosom) > 0.000001) {
        omega = Math.acos(cosom);
        sinom = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {
        scale0 = 1.0 - t;
        scale1 = t;
    }
    return [
        scale0 * ax + scale1 * bx,
        scale0 * ay + scale1 * by,
        scale0 * az + scale1 * bz,
        scale0 * aw + scale1 * bw,
    ];
}

export function interpAngle(a: number, b: number, t: number): number {
    const shortestAngle = ((((b - a) % (Math.PI * 2)) + Math.PI) % (Math.PI * 2)) - Math.PI;
    return (a + shortestAngle * t) % (Math.PI * 2);
}

export const projectPointToPlane = (function () {
    const tmp_det = new Float32Array(3);
    return function (
        out: vec3,
        origin: ReadonlyVec3,
        normal: ReadonlyVec3,
        point: ReadonlyVec3
    ) {
        vec3.sub(tmp_det, point, origin);
        const dist = vec3.dot(tmp_det, normal);
        vec3.scaleAndAdd(out, point, normal, -dist);
    };
})();

export function closestPointsBetweenTwoLines(
    out1: vec3 | null, out2: vec3 | null,
    p1x: number, p1y: number, p1z: number,
    n1x: number, n1y: number, n1z: number,
    p2x: number, p2y: number, p2z: number,
    n2x: number, n2y: number, n2z: number
): boolean {
    let d = n1x ** 2 * n2y ** 2
        + n1x ** 2 * n2z ** 2
        - 2 * n1x * n1y * n2x * n2y
        - 2 * n1x * n1z * n2x * n2z
        + n1y ** 2 * n2x ** 2
        + n1y ** 2 * n2z ** 2
        - 2 * n1y * n1z * n2y * n2z
        + n1z ** 2 * n2x ** 2
        + n1z ** 2 * n2y ** 2;
    let parallel = false;
    let t1 = (
        n1x * n2x * n2y * p1y
        - n1x * n2x * n2y * p2y
        + n1x * n2x * n2z * p1z
        - n1x * n2x * n2z * p2z
        - n1x * n2y ** 2 * p1x
        + n1x * n2y ** 2 * p2x
        - n1x * n2z ** 2 * p1x
        + n1x * n2z ** 2 * p2x
        - n1y * n2x ** 2 * p1y
        + n1y * n2x ** 2 * p2y
        + n1y * n2x * n2y * p1x
        - n1y * n2x * n2y * p2x
        + n1y * n2y * n2z * p1z
        - n1y * n2y * n2z * p2z
        - n1y * n2z ** 2 * p1y
        + n1y * n2z ** 2 * p2y
        - n1z * n2x ** 2 * p1z
        + n1z * n2x ** 2 * p2z
        + n1z * n2x * n2z * p1x
        - n1z * n2x * n2z * p2x
        - n1z * n2y ** 2 * p1z
        + n1z * n2y ** 2 * p2z
        + n1z * n2y * n2z * p1y
        - n1z * n2y * n2z * p2y) / d;
    if (!isFinite(t1)) {
        parallel = true;
        t1 = 0;
    }
    let o1x = p1x + n1x * t1;
    let o1y = p1y + n1y * t1;
    let o1z = p1z + n1z * t1;
    if (out1) {
        out1[0] = o1x;
        out1[1] = o1y;
        out1[2] = o1z;
    }
    if (out2) {
        let t3 = (
            -n1x * n2y * p1z
            + n1x * n2y * p2z
            + n1x * n2z * p1y
            - n1x * n2z * p2y
            + n1y * n2x * p1z
            - n1y * n2x * p2z
            - n1y * n2z * p1x
            + n1y * n2z * p2x
            - n1z * n2x * p1y
            + n1z * n2x * p2y
            + n1z * n2y * p1x
            - n1z * n2y * p2x) / d;
        if (isFinite(t3)) {
            let n3x = n1y * n2z - n1z * n2y;
            let n3y = -n1x * n2z + n1z * n2x;
            let n3z = n1x * n2y - n1y * n2x;
            out2[0] = o1x + n3x * t3;
            out2[1] = o1y + n3y * t3;
            out2[2] = o1z + n3z * t3;
        } else {
            parallel = true;
            let n3x = n1y * (p1z - p2z) - n1z * (p1y - p2y);
            let n3y = -n1x * (p1z - p2z) + n1z * (p1x - p2x);
            let n3z = n1x * (p1y - p2y) - n1y * (p1x - p2x);
            out2[0] = o1x + n1y * n3z - n1z * n3y;
            out2[1] = o1y + -n1x * n3z + n1z * n3x;
            out2[2] = o1z + n1x * n3y - n1y * n3x;
        }
    }
    return parallel;
}

export function closestPointOnSegment(
    out: vec2,
    px: number, py: number,
    x0: number, y0: number, x1: number, y1: number,
) {
    let nx = x1 - x0;
    let ny = y1 - y0;
    const len = Math.sqrt(nx ** 2 + ny ** 2);
    nx /= len;
    ny /= len;
    const dx = px - x0;
    const dy = py - y0;
    let proj = dx * nx + dy * ny;
    if (proj < 0) {
        proj = 0;
    }
    if (proj > len) {
        proj = len;
    }
    out[0] = proj * nx + x0;
    out[1] = proj * ny + y0;
    return out;
}
