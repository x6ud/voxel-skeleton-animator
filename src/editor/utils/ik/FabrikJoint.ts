import {quat, vec3} from 'gl-matrix';

export default class FabrikJoint {
    length: number = 1;

    start = vec3.create();
    end = vec3.create();
    rotation = quat.create();
    normal = vec3.create();
    up = vec3.create();
}