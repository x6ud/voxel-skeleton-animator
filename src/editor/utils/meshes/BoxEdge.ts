import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';

export default class BoxEdge extends Transform3D {

    private readonly geometry: Geometry = new Geometry();
    private _x0: number = 0;
    private _x1: number = 0;
    private _y0: number = 0;
    private _y1: number = 0;
    private _z0: number = 0;
    private _z1: number = 0;
    private _color: number[];
    private needsUpdate: boolean = true;

    constructor(color: number[] = [1, 1, 1, 1]) {
        super();
        this._color = color;
    }

    get x0(): number {
        return this._x0;
    }

    set x0(value: number) {
        if (value === this._x0) {
            return;
        }
        this._x0 = value;
        this.needsUpdate = true;
    }

    get x1(): number {
        return this._x1;
    }

    set x1(value: number) {
        if (value === this._x1) {
            return;
        }
        this._x1 = value;
        this.needsUpdate = true;
    }

    get y0(): number {
        return this._y0;
    }

    set y0(value: number) {
        if (value === this._y0) {
            return;
        }
        this._y0 = value;
        this.needsUpdate = true;
    }

    get y1(): number {
        return this._y1;
    }

    set y1(value: number) {
        if (value === this._y1) {
            return;
        }
        this._y1 = value;
        this.needsUpdate = true;
    }

    get z0(): number {
        return this._z0;
    }

    set z0(value: number) {
        if (value === this._z0) {
            return;
        }
        this._z0 = value;
        this.needsUpdate = true;
    }

    get z1(): number {
        return this._z1;
    }

    set z1(value: number) {
        if (value === this._z1) {
            return;
        }
        this._z1 = value;
        this.needsUpdate = true;
    }

    get color(): number[] {
        return this._color;
    }

    set color(value: number[]) {
        this.needsUpdate = true;
        this._color = value;
    }

    private update(renderer: Renderer) {
        this.dispose(renderer);
        const geometry = this.geometry;
        geometry.type = Geometry.TYPE_LINES;
        const a = [this._x0, this._y1, this._z0];
        const b = [this._x1, this._y1, this._z0];
        const c = [this._x1, this._y1, this._z1];
        const d = [this._x0, this._y1, this._z1];
        const e = [this._x0, this._y0, this._z0];
        const f = [this._x1, this._y0, this._z0];
        const g = [this._x1, this._y0, this._z1];
        const h = [this._x0, this._y0, this._z1];
        const vertices = [a, b, c, d, e, f, g, h];
        geometry.setVertices(vertices.map(point => ({'a_color': this._color, 'a_position': point})));
        geometry.indices = [
            0, 1,
            1, 2,
            2, 3,
            3, 0,
            0, 4,
            1, 5,
            2, 6,
            3, 7,
            4, 5,
            5, 6,
            6, 7,
            7, 4
        ];
    }

    render(renderer: Renderer) {
        if (this.needsUpdate) {
            this.update(renderer);
        }
        renderer.uniform('u_mMatrix', this.matrix);
        renderer.drawGeometry(this.geometry);
    }

    dispose(renderer: Renderer) {
        renderer.disposeGeometry(this.geometry);
    }

}