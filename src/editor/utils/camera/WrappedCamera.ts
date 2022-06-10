import {quat, ReadonlyMat4, ReadonlyVec3, vec3} from 'gl-matrix';
import Camera3D from '../../../common/render/camera/Camera3D';
import OrthographicCamera from '../../../common/render/camera/OrthographicCamera';
import PerspectiveCamera from '../../../common/render/camera/PerspectiveCamera';

export default class WrappedCamera {

    private readonly perspectiveCamera: PerspectiveCamera;
    private readonly orthographicCamera: OrthographicCamera;

    zoomInStep = 0.9;
    zoomOutStep = 1.15;
    perspective: boolean = true;
    far: number = 1;
    readonly target: vec3 = vec3.fromValues(0, 0, 0);
    readonly position: vec3 = vec3.fromValues(0, 0, 0);
    rotateXDeg: number = 0;
    rotateYDeg: number = 0;
    zoom: number = 22;
    orthographicZoomRatio: number = 0.05;

    private readonly defaultPosition: ReadonlyVec3 = vec3.fromValues(0, 0, 1);
    private readonly defaultUp: ReadonlyVec3 = vec3.fromValues(0, 1, 0);
    private readonly up = vec3.fromValues(0, 0, 0);
    private readonly rotationQuat = quat.create();

    constructor(fovYRad: number = 45 / 180 * Math.PI, near: number = 0.1, far: number = 10000) {
        this.perspectiveCamera = new PerspectiveCamera(fovYRad, 1, near, far);
        this.orthographicCamera = new OrthographicCamera(-1, 1, -1, 1, near, far);
    }

    update(viewWidth: number, viewHeight: number) {
        const camera = this.camera;
        const zoom = this.zoom <= 0 ? this.zoomInStep ** (-this.zoom) : this.zoomOutStep ** this.zoom;
        const viewPortZoom = zoom / 25 * (this.perspective ? 1 : this.orthographicZoomRatio);
        camera.fitViewport(viewWidth * viewPortZoom, viewHeight * viewPortZoom);
        vec3.scale(this.position, this.defaultPosition, this.far * zoom * 2);
        quat.fromEuler(this.rotationQuat, this.rotateXDeg, this.rotateYDeg, 0);
        vec3.transformQuat(this.position, this.position, this.rotationQuat);
        vec3.add(this.position, this.position, this.target);
        camera.position = this.position;
        if (this.rotateXDeg === 90 || this.rotateXDeg === -90) {
            vec3.transformQuat(this.up, this.defaultUp, this.rotationQuat);
            camera.up = this.up;
        } else {
            camera.up = this.defaultUp;
        }
        camera.target = this.target;
    }

    screenToView(out: vec3, point: ReadonlyVec3) {
        const camera = this.perspective ? this.perspectiveCamera : this.orthographicCamera;
        camera.screenToView(out, point);
    }

    get pvMatrix(): ReadonlyMat4 {
        const camera = this.perspective ? this.perspectiveCamera : this.orthographicCamera;
        return camera.pvMatrix;
    }

    get camera(): Camera3D {
        return this.perspective ? this.perspectiveCamera : this.orthographicCamera;
    }

}