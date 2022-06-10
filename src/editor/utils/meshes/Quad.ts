import {ReadonlyVec3, vec3} from 'gl-matrix';
import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';

const WHITE = [1, 1, 1, 1];
const INDICES: number[] = [
    0, 1, 2, 0, 2, 3
];

export default class Quad extends Transform3D {

    private _p0: [number, number, number] = [0, 0, 0];
    private _p1: [number, number, number] = [0, 0, 0];
    private _p2: [number, number, number] = [0, 0, 0];
    private _p3: [number, number, number] = [0, 0, 0];
    private geometry = new Geometry();
    private geometryNeedsUpdate = true;

    get p0(): ReadonlyVec3 {
        return this._p0;
    }

    set p0(value: ReadonlyVec3) {
        if (vec3.exactEquals(value, this._p0)) {
            return;
        }
        vec3.copy(this._p0, value);
        this.geometryNeedsUpdate = true;
    }

    get p1(): ReadonlyVec3 {
        return this._p1;
    }

    set p1(value: ReadonlyVec3) {
        if (vec3.exactEquals(value, this._p1)) {
            return;
        }
        vec3.copy(this._p1, value);
        this.geometryNeedsUpdate = true;
    }

    get p2(): ReadonlyVec3 {
        return this._p2;
    }

    set p2(value: ReadonlyVec3) {
        if (vec3.exactEquals(value, this._p2)) {
            return;
        }
        vec3.copy(this._p2, value);
        this.geometryNeedsUpdate = true;
    }

    get p3(): ReadonlyVec3 {
        return this._p3;
    }

    set p3(value: ReadonlyVec3) {
        if (vec3.exactEquals(value, this._p3)) {
            return;
        }
        vec3.copy(this._p3, value);
        this.geometryNeedsUpdate = true;
    }

    render(renderer: Renderer) {
        if (this.geometryNeedsUpdate) {
            const geometry = this.geometry;
            geometry.setVertices([
                {'a_position': this._p0, 'a_color': WHITE},
                {'a_position': this._p1, 'a_color': WHITE},
                {'a_position': this._p2, 'a_color': WHITE},
                {'a_position': this._p3, 'a_color': WHITE},
            ]);
            geometry.indices = INDICES;
            renderer.updateGeometryVertices(geometry);
            this.geometryNeedsUpdate = false;
        }
        renderer.uniform('u_mMatrix', this.matrix);
        renderer.drawGeometry(this.geometry);
    }

    dispose(renderer: Renderer) {
        renderer.disposeGeometry(this.geometry);
    }

}