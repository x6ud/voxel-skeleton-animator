import {ReadonlyVec4, vec4} from 'gl-matrix';
import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';
import {addConeXAxis, addCylinderXAxis, FaceVertex} from './helper';

export default class Arrow extends Transform3D {

    private _length: number = 5;
    private _thickness: number = 0.3;
    private _shaft: boolean = true;
    private _arrowheadSize: number = 1;
    private _arrowheadAngle: number = 30 / 180 * Math.PI;
    private _color: [number, number, number, number] = [1, 1, 1, 1];
    private geometry = new Geometry();
    private geometryNeedsUpdate = true;

    get length(): number {
        return this._length;
    }

    set length(value: number) {
        if (value === this._length) {
            return;
        }
        this._length = value;
        this.geometryNeedsUpdate = true;
    }

    get shaft(): boolean {
        return this._shaft;
    }

    set shaft(value: boolean) {
        if (value === this._shaft) {
            return;
        }
        this._shaft = value;
        this.geometryNeedsUpdate = true;
    }

    get arrowheadSize(): number {
        return this._arrowheadSize;
    }

    set arrowheadSize(value: number) {
        if (value === this._arrowheadSize) {
            return;
        }
        this._arrowheadSize = value;
        this.geometryNeedsUpdate = true;
    }

    get arrowheadAngle(): number {
        return this._arrowheadAngle;
    }

    set arrowheadAngle(value: number) {
        if (value === this._arrowheadAngle) {
            return;
        }
        this._arrowheadAngle = value;
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
        const length = this._length;
        const shaftLength = Math.max(length - this._arrowheadSize, 0);
        const shaftRadius = this.thickness / 2;
        const arrowRadius = Math.tan(this._arrowheadAngle / 2) * this._arrowheadSize;

        if (this._shaft) {
            addCylinderXAxis(
                vertices, indices, color,
                0, shaftLength, shaftRadius, 8
            );
        }
        addConeXAxis(
            vertices, indices, color,
            shaftLength, length, arrowRadius, 8
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