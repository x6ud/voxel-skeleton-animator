import {mat4, ReadonlyMat4, ReadonlyVec3, vec3} from 'gl-matrix';
import FrameBuffer from '../../../common/render/FrameBuffer';
import Renderer from '../../../common/render/Renderer';
import Texture from '../../../common/render/Texture';

export default class DirectionalLight {

    width: number;
    height: number;
    private _near: number;
    private _far: number;
    private _position = vec3.create();
    private _target = vec3.create();
    private _up = vec3.fromValues(0, 1, 0);
    private _viewportWidth: number;
    private _viewportHeight: number;

    private needsUpdate = true;
    private projectionMatrix = mat4.create();
    private viewMatrix = mat4.create();
    private _pvMatrix = mat4.create();
    private _textureMatrix = mat4.create();

    private originalViewportWidth: number = 0;
    private originalViewportHeight: number = 0;

    private _frameBuffer?: FrameBuffer;

    constructor(width: number, height: number, near: number = 0, far: number = 1000) {
        this.width = width;
        this.height = height;
        this._near = near;
        this._far = far;
        this._viewportWidth = width;
        this._viewportHeight = height;
    }

    get position(): ReadonlyVec3 {
        return this._position;
    }

    set position(value: ReadonlyVec3) {
        if (vec3.exactEquals(value, this._position)) {
            return;
        }
        vec3.copy(this._position, value);
        this.needsUpdate = true;
    }

    get target(): ReadonlyVec3 {
        return this._target;
    }

    set target(value: ReadonlyVec3) {
        if (vec3.exactEquals(value, this._target)) {
            return;
        }
        vec3.copy(this._target, value);
        this.needsUpdate = true;
    }

    get up(): ReadonlyVec3 {
        return this._up;
    }

    set up(value: ReadonlyVec3) {
        if (vec3.exactEquals(value, this._up)) {
            return;
        }
        vec3.copy(this._up, value);
        this.needsUpdate = true;
    }

    get near(): number {
        return this._near;
    }

    set near(value: number) {
        if (value === this._near) {
            return;
        }
        this._near = value;
        this.needsUpdate = true;
    }

    get far(): number {
        return this._far;
    }

    set far(value: number) {
        if (value === this._far) {
            return;
        }
        this._far = value;
        this.needsUpdate = true;
    }

    get viewportWidth(): number {
        return this._viewportWidth;
    }

    set viewportWidth(value: number) {
        if (value === this._viewportWidth) {
            return;
        }
        this._viewportWidth = value;
        this.needsUpdate = true;
    }

    get viewportHeight(): number {
        return this._viewportHeight;
    }

    set viewportHeight(value: number) {
        if (value === this._viewportHeight) {
            return;
        }
        this._viewportHeight = value;
        this.needsUpdate = true;
    }

    get textureMatrix(): ReadonlyMat4 {
        this.update();
        return this._textureMatrix;
    }

    get pvMatrix(): ReadonlyMat4 {
        this.update();
        return this._pvMatrix;
    }

    get depthTexture(): Texture | undefined {
        return this._frameBuffer?.depthTexture;
    }

    private update() {
        if (!this.needsUpdate) {
            return;
        }

        mat4.ortho(
            this.projectionMatrix,
            -this.viewportWidth / 2,
            this.viewportWidth / 2,
            -this.viewportHeight / 2,
            this.viewportHeight / 2,
            this._near,
            this._far
        );
        mat4.lookAt(this.viewMatrix, this._position, this._target, this._up);
        mat4.mul(this._pvMatrix, this.projectionMatrix, this.viewMatrix);

        mat4.identity(this._textureMatrix);
        mat4.translate(this._textureMatrix, this._textureMatrix, [.5, .5, .5]);
        mat4.scale(this._textureMatrix, this._textureMatrix, [.5, .5, .5]);
        mat4.mul(this._textureMatrix, this._textureMatrix, this._pvMatrix);

        this.needsUpdate = false;
    }

    beginProjection(renderer: Renderer) {
        this.update();
        if (!this._frameBuffer) {
            this._frameBuffer = renderer.createFrameBuffer();
            renderer.attachDepthTexture(this._frameBuffer, renderer.createDepthTexture(this.width, this.height));
        } else {
            renderer.resizeFrameBufferTextures(this._frameBuffer, this.width, this.height);
        }
        renderer.startCapture(this._frameBuffer);
        renderer.uniform('u_pvMatrix', this._pvMatrix);
        renderer.clear(false, true, false);
        this.originalViewportWidth = renderer.state.width;
        this.originalViewportHeight = renderer.state.height;
        renderer.viewport(this.width, this.height);
    }

    endProjection(renderer: Renderer) {
        renderer.viewport(this.originalViewportWidth, this.originalViewportHeight);
        renderer.endCapture();
    }

}