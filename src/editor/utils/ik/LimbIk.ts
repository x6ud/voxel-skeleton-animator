import {mat4, quat, ReadonlyVec3, vec3} from 'gl-matrix';
import {isVec3Zero, quatFromTwoVec} from '../geometry/math';

const localMat1 = mat4.create();
const localMat2 = mat4.create();
const worldMat1 = mat4.create();
const worldMat2 = mat4.create();

const start = vec3.create();
const end1 = vec3.create();
const end1b = vec3.create();
const end2 = vec3.create();

const localStart = vec3.create();
const localEnd1 = vec3.create();
const localTarget = vec3.create();

const vecBone1 = vec3.create();
const vecBone2 = vec3.create();
const vecTarget = vec3.create();
const vecBone1b = vec3.create();

const invMat1 = mat4.create();
const invMat2 = mat4.create();
const detRotation = quat.create();

const rotationAxis = vec3.create();

export default class LimbIk {

    matrix = mat4.create();

    localRotation1 = quat.create();
    localTranslation1 = vec3.create();
    length1 = 0;

    localRotation2 = quat.create();
    localTranslation2 = vec3.create();
    length2 = 0;

    resolve(target: ReadonlyVec3) {
        mat4.fromRotationTranslation(localMat1, this.localRotation1, this.localTranslation1);
        mat4.fromRotationTranslation(localMat2, this.localRotation2, this.localTranslation2);
        mat4.mul(worldMat1, this.matrix, localMat1);
        mat4.mul(worldMat2, worldMat1, localMat2);
        mat4.getTranslation(start, worldMat1);
        mat4.getTranslation(end1, worldMat2);

        // cannot form a triangle
        const distTarget = vec3.distance(start, target);
        const tooFar = distTarget >= this.length1 + this.length2;
        const tooClose = distTarget < Math.abs(this.length1 - this.length2);
        if (tooFar || tooClose) {
            mat4.invert(invMat2, worldMat2);
            vec3.transformMat4(localStart, start, invMat2);
            vec3.transformMat4(localEnd1, end1, invMat2);
            vec3.sub(vecBone1, localEnd1, localStart);
            if (tooClose) {
                vec3.negate(vecBone1, vecBone1);
            }
            vec3.set(vecBone2, 1, 0, 0);
            quatFromTwoVec(detRotation, vecBone2, vecBone1);
            quat.mul(this.localRotation2, this.localRotation2, detRotation);
            quat.normalize(this.localRotation2, this.localRotation2);

            mat4.invert(invMat1, worldMat1);
            vec3.transformMat4(localStart, start, invMat1);
            vec3.transformMat4(localEnd1, end1, invMat1);
            vec3.transformMat4(localTarget, target, invMat1);
            vec3.sub(vecBone1, localEnd1, localStart);
            if (tooClose && this.length1 < this.length2) {
                vec3.negate(vecBone1, vecBone1);
            }
            vec3.sub(vecTarget, localTarget, localStart);
            quatFromTwoVec(detRotation, vecBone1, vecTarget);
            quat.mul(this.localRotation1, this.localRotation1, detRotation);
            quat.normalize(this.localRotation1, this.localRotation1);
            return;
        }

        // find rotate angle
        vec3.sub(vecTarget, target, start);
        vec3.sub(vecBone1, end1, start);
        vec3.normalize(vecTarget, vecTarget);
        vec3.normalize(vecBone1, vecBone1);
        let detAngle =
            Math.acos(Math.max(-1, Math.min(1, vec3.dot(vecBone1, vecTarget)))) -
            Math.acos(Math.max(-1, Math.min(1, -(this.length2 ** 2 - this.length1 ** 2 - distTarget ** 2) / (2 * this.length1 * distTarget))));
        if (!isFinite(detAngle)) {
            detAngle = 0;
        }
        // find rotate axis
        vec3.cross(rotationAxis, vecTarget, vecBone1);
        vec3.normalize(rotationAxis, rotationAxis);
        if (isVec3Zero(rotationAxis)) {
            if (Math.abs(vecBone1[0]) > Math.abs(vecBone1[2])) {
                rotationAxis[0] = -vecBone1[1];
                rotationAxis[1] = vecBone1[0];
                rotationAxis[2] = 0;
            } else {
                rotationAxis[0] = 0;
                rotationAxis[1] = -vecBone1[2];
                rotationAxis[2] = vecBone1[1];
            }
        }
        quat.setAxisAngle(detRotation, rotationAxis, -detAngle);

        // rotate bone 1
        vec3.sub(vecBone1b, end1, start);
        vec3.transformQuat(vecBone1b, vecBone1b, detRotation);
        vec3.add(end1b, start, vecBone1b);
        mat4.invert(invMat1, worldMat1);
        vec3.transformMat4(vecBone1b, end1b, invMat1);
        vec3.transformMat4(vecBone1, end1, invMat1);
        quatFromTwoVec(detRotation, vecBone1, vecBone1b);
        quat.mul(this.localRotation1, this.localRotation1, detRotation);
        quat.normalize(this.localRotation1, this.localRotation1);

        // update matrix
        mat4.fromRotationTranslation(localMat1, this.localRotation1, this.localTranslation1);
        mat4.mul(worldMat1, this.matrix, localMat1);
        mat4.mul(worldMat2, worldMat1, localMat2);
        vec3.set(end2, this.length2, 0, 0);
        vec3.transformMat4(end2, end2, worldMat2);

        // rotate bone 2
        mat4.invert(invMat2, worldMat2);
        vec3.transformMat4(vecBone2, end2, invMat2);
        vec3.transformMat4(vecTarget, target, invMat2);
        quatFromTwoVec(detRotation, vecBone2, vecTarget);
        quat.mul(this.localRotation2, this.localRotation2, detRotation);
        quat.normalize(this.localRotation2, this.localRotation2);
    }

}
