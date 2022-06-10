import {ReadonlyVec3, vec3} from 'gl-matrix';
import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';

export default class VoxelFaceEdge extends Transform3D {

    private readonly geometry = new Geometry(Geometry.TYPE_LINES);
    private needsUpdate = true;

    private _voxelPosition = vec3.create();
    private _faceNormal = vec3.create();
    private _color: [number, number, number, number];
    private _isSpace: boolean = false;

    constructor(color: [number, number, number, number] = [1, 1, 1, 1]) {
        super();
        this._color = color;
    }

    get voxelPosition(): ReadonlyVec3 {
        return this._voxelPosition;
    }

    set voxelPosition(value: ReadonlyVec3) {
        if (vec3.exactEquals(this._voxelPosition, value)) {
            return;
        }
        vec3.copy(this._voxelPosition, value);
        this.needsUpdate = true;
    }

    get faceNormal(): ReadonlyVec3 {
        return this._faceNormal;
    }

    set faceNormal(value: ReadonlyVec3) {
        if (vec3.exactEquals(this._faceNormal, value)) {
            return;
        }
        vec3.copy(this._faceNormal, value);
        this.needsUpdate = true;
    }

    get color(): [number, number, number, number] {
        return this._color;
    }

    set color(value: [number, number, number, number]) {
        this._color = value;
        this.needsUpdate = true;
    }

    get isSpace(): boolean {
        return this._isSpace;
    }

    set isSpace(value: boolean) {
        if (value === this._isSpace) {
            return;
        }
        this._isSpace = value;
        this.needsUpdate = true;
    }

    private update(renderer: Renderer) {
        renderer.disposeGeometry(this.geometry);

        const p0: vec3 = [0, 0, 0];
        const p1: vec3 = [0, 0, 0];
        const p2: vec3 = [0, 0, 0];
        const p3: vec3 = [0, 0, 0];

        const pos = this._voxelPosition;

        const offset = this.isSpace ? 0 : 1;

        if (this.faceNormal[0]) {
            if (this.faceNormal[0] > 0) {
                vec3.set(p0, pos[0] + offset, pos[1], pos[2]);
                vec3.set(p1, pos[0] + offset, pos[1] + 1, pos[2]);
                vec3.set(p2, pos[0] + offset, pos[1] + 1, pos[2] + 1);
                vec3.set(p3, pos[0] + offset, pos[1], pos[2] + 1);
            } else {
                vec3.set(p0, pos[0], pos[1], pos[2]);
                vec3.set(p1, pos[0], pos[1] + 1, pos[2]);
                vec3.set(p2, pos[0], pos[1] + 1, pos[2] + 1);
                vec3.set(p3, pos[0], pos[1], pos[2] + 1);
            }
        } else if (this.faceNormal[1]) {
            if (this.faceNormal[1] > 0) {
                vec3.set(p0, pos[0], pos[1] + offset, pos[2]);
                vec3.set(p1, pos[0] + 1, pos[1] + offset, pos[2]);
                vec3.set(p2, pos[0] + 1, pos[1] + offset, pos[2] + 1);
                vec3.set(p3, pos[0], pos[1] + offset, pos[2] + 1);
            } else {
                vec3.set(p0, pos[0], pos[1], pos[2]);
                vec3.set(p1, pos[0] + 1, pos[1], pos[2]);
                vec3.set(p2, pos[0] + 1, pos[1], pos[2] + 1);
                vec3.set(p3, pos[0], pos[1], pos[2] + 1);
            }
        } else if (this.faceNormal[2]) {
            if (this.faceNormal[2] > 0) {
                vec3.set(p0, pos[0], pos[1], pos[2] + offset);
                vec3.set(p1, pos[0] + 1, pos[1], pos[2] + offset);
                vec3.set(p2, pos[0] + 1, pos[1] + 1, pos[2] + offset);
                vec3.set(p3, pos[0], pos[1] + 1, pos[2] + offset);
            } else {
                vec3.set(p0, pos[0], pos[1], pos[2]);
                vec3.set(p1, pos[0] + 1, pos[1], pos[2]);
                vec3.set(p2, pos[0] + 1, pos[1] + 1, pos[2]);
                vec3.set(p3, pos[0], pos[1] + 1, pos[2]);
            }
        }

        this.geometry.setVertices([
            {['a_position']: p0, ['a_color']: this.color},
            {['a_position']: p1, ['a_color']: this.color},
            {['a_position']: p2, ['a_color']: this.color},
            {['a_position']: p3, ['a_color']: this.color}
        ]);
        this.geometry.indices = [
            0, 1,
            1, 2,
            2, 3,
            3, 0
        ];

        this.needsUpdate = false;
    }

    dispose(renderer: Renderer) {
        renderer.disposeGeometry(this.geometry);
    }

    render(renderer: Renderer) {
        if (this.needsUpdate) {
            this.update(renderer);
        }
        renderer.drawGeometry(this.geometry);
    }

}