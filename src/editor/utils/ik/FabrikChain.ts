import {quat, ReadonlyVec3, vec3} from 'gl-matrix';
import {getVertical, isVec3Zero, projectPointToPlane, quatFromRightUp, quatFromTwoUnitVec} from '../geometry/math';
import FabrikJoint from './FabrikJoint';

const ZERO = vec3.create();
const ref = vec3.create();
const up = vec3.create();
const rotationPlaneNormal = vec3.create();
const prevIterEnd = vec3.create();

export default class FabrikChain {
    iterLimit: number = 20;
    precision: number = 0.01;
    joints: FabrikJoint[] = [];

    resolve(middleEffector: ReadonlyVec3, endEffector: ReadonlyVec3) {
        const joints = this.joints;
        const len = joints.length;
        if (!len) {
            return;
        }
        vec3.normalize(ref, middleEffector);
        if (isVec3Zero(ref)) {
            vec3.set(ref, 1, 0, 0);
        }
        vec3.cross(rotationPlaneNormal, endEffector, ref);
        vec3.normalize(rotationPlaneNormal, rotationPlaneNormal);
        if (isVec3Zero(rotationPlaneNormal)) {
            getVertical(rotationPlaneNormal, ref);
            vec3.negate(rotationPlaneNormal, rotationPlaneNormal);
        }
        vec3.cross(up, rotationPlaneNormal, ref);

        // init
        let start = ZERO;
        for (let joint of joints) {
            vec3.copy(joint.normal, ref);
            vec3.copy(joint.up, up);
            vec3.copy(joint.start, start);
            updateJointRotation(joint);
            setJointStart(joint, start);
            start = joint.end;
        }

        // fabrik
        const precision = this.precision;
        const tailEnd = joints[len - 1].end;
        vec3.copy(prevIterEnd, tailEnd);
        for (let iter = 0, iterLimit = this.iterLimit; iter < iterLimit; ++iter) {
            // forward
            let end = endEffector;
            for (let i = len - 1; i >= 0; --i) {
                const joint = joints[i];
                setJointDirectionWithRotationAxis(joint, rotationPlaneNormal, joint.start, end);
                setJointEnd(joint, end);
                end = joint.start;
            }

            // backward
            let start = ZERO;
            for (let i = 0; i < len; ++i) {
                const joint = joints[i];
                setJointDirectionWithRotationAxis(joint, rotationPlaneNormal, start, joint.end);
                setJointStart(joint, start);
                start = joint.end;
            }

            if (
                vec3.sqrDist(tailEnd, endEffector) <= precision
                || vec3.sqrDist(tailEnd, prevIterEnd) <= precision
            ) {
                break;
            }
            vec3.copy(prevIterEnd, tailEnd);
        }
    }
}

function setJointStart(joint: FabrikJoint, start: ReadonlyVec3) {
    vec3.copy(joint.start, start);
    vec3.scaleAndAdd(joint.end, start, joint.normal, joint.length);
}

function setJointEnd(joint: FabrikJoint, end: ReadonlyVec3) {
    vec3.copy(joint.end, end);
    vec3.scaleAndAdd(joint.start, end, joint.normal, -joint.length);
}

function updateJointRotation(joint: FabrikJoint) {
    quatFromRightUp(joint.rotation, joint.normal, joint.up);
}

const vTarget = vec3.create();
const detRotation = quat.create();

function setJointDirectionWithRotationAxis(
    joint: FabrikJoint,
    axis: ReadonlyVec3,
    origin: ReadonlyVec3,
    target: ReadonlyVec3
) {
    projectPointToPlane(vTarget, origin, axis, target);
    vec3.sub(vTarget, vTarget, origin);
    vec3.normalize(vTarget, vTarget);
    if (vec3.equals(vTarget, ZERO)) {
        return;
    }
    quatFromTwoUnitVec(detRotation, joint.normal, vTarget);
    vec3.transformQuat(joint.normal, joint.normal, detRotation);
    vec3.transformQuat(joint.up, joint.up, detRotation);
    updateJointRotation(joint);
}
