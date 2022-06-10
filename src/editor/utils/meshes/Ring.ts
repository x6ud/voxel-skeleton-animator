import {ReadonlyVec4, vec4} from 'gl-matrix';
import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';
import {addQuatFace, FaceVertex} from './helper';

export default class Ring extends Transform3D {

    private _width = .15;
    private _thickness = .15;
    private _radius = 6;
    private _color: [number, number, number, number] = [1, 1, 1, 1];
    private geometry = new Geometry();
    private geometryNeedsUpdate = true;

    get width(): number {
        return this._width;
    }

    set width(value: number) {
        if (value === this._width) {
            return;
        }
        this._width = value;
        this.geometryNeedsUpdate = true;
    }

    get thickness(): number {
        return this._thickness;
    }

    set thickness(value: number) {
        if (value === this._thickness) {
            return;
        }
        this._thickness = value;
        this.geometryNeedsUpdate = true;
    }

    get radius(): number {
        return this._radius;
    }

    set radius(value: number) {
        if (value === this._radius) {
            return;
        }
        this._radius = value;
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
        const radius = this._radius;
        const thickness = this._thickness;
        const half = this._width / 2;

        const seg = 32;
        const detAngle = Math.PI * 2 / seg;
        const cos = Math.cos(detAngle);
        const sin = Math.sin(detAngle);
        let y0o = 0;
        let z0o = radius;
        let y0i = 0;
        let z0i = radius - thickness;
        for (let i = 0; i < seg; ++i) {
            const y1o = y0o * cos - z0o * sin;
            const z1o = y0o * sin + z0o * cos;
            const y1i = y0i * cos - z0i * sin;
            const z1i = y0i * sin + z0i * cos;
            addQuatFace(
                vertices,
                indices,
                color,
                [half, y0o, z0o],
                [-half, y0o, z0o],
                [-half, y1o, z1o],
                [half, y1o, z1o],
            );
            addQuatFace(
                vertices,
                indices,
                color,
                [-half, y0i, z0i],
                [half, y0i, z0i],
                [half, y1i, z1i],
                [-half, y1i, z1i],
            );
            addQuatFace(
                vertices,
                indices,
                color,
                [half, y0o, z0o],
                [half, y1o, z1o],
                [half, y1i, z1i],
                [half, y0i, z0i],
            );
            addQuatFace(
                vertices,
                indices,
                color,
                [-half, y1o, z1o],
                [-half, y0o, z0o],
                [-half, y0i, z0i],
                [-half, y1i, z1i],
            );
            y0o = y1o;
            z0o = z1o;
            y0i = y1i;
            z0i = z1i;
        }
        this.geometry.setVertices(vertices);
        this.geometry.indices = indices;
    }

    render(renderer: Renderer) {
        this.updateGeometry(renderer);
        renderer.uniform('u_mMatrix', this.matrix);
        renderer.drawGeometry(this.geometry);
    }

}