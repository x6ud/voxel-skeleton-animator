import {ReadonlyVec4, vec4} from 'gl-matrix';
import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';
import {addConeXAxis, FaceVertex} from './helper';

export default class Cone extends Transform3D {

    private _size: number = 1;
    private _angle: number = 10 / 180 * Math.PI;
    private _color: [number, number, number, number] = [1, 1, 1, 1];
    private geometry = new Geometry();
    private geometryNeedsUpdate = true;

    get size(): number {
        return this._size;
    }

    set size(value: number) {
        if (value === this._size) {
            return;
        }
        this._size = value;
        this.geometryNeedsUpdate = true;
    }

    get angle(): number {
        return this._angle;
    }

    set angle(value: number) {
        if (value === this._angle) {
            return;
        }
        this._angle = value;
        this.geometryNeedsUpdate = true;
    }

    get color(): ReadonlyVec4 {
        return this._color;
    }

    set color(value: ReadonlyVec4) {
        if (vec4.exactEquals(value, this._color)) {
            return;
        }
        vec4.copy(this._color, value);
        this.geometryNeedsUpdate = true;
    }

    dispose(renderer: Renderer) {
        renderer.disposeGeometry(this.geometry);
    }

    private updateGeometry(renderer: Renderer) {
        if (!this.geometryNeedsUpdate) {
            return;
        }
        this.geometryNeedsUpdate = false;
        renderer.disposeGeometry(this.geometry);

        const vertices: FaceVertex[] = [];
        const indices: number[] = [];
        const color = this._color;
        const radius = Math.tan(this._angle / 2) * this._size;

        addConeXAxis(
            vertices, indices, color,
            0, this._size, radius, 4
        );

        this.geometry.setVertices(vertices);
        this.geometry.indices = indices;
    }

    render(renderer: Renderer) {
        this.updateGeometry(renderer);
        renderer.uniform('u_mMatrix', this.matrix);
        renderer.drawGeometry(this.geometry);
    }

}