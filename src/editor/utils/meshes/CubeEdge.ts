import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';

export default class CubeEdge extends Transform3D {

    private readonly geometry: Geometry;

    constructor(
        private readonly size: number = 1,
        color: number[] = [1, 1, 1, 1]
    ) {
        super();
        const geometry = this.geometry = new Geometry();
        geometry.type = Geometry.TYPE_LINES;

        const x0 = 0;
        const x1 = size;
        const y0 = 0;
        const y1 = size;
        const z0 = size;
        const z1 = 0;

        //       d--------c
        //   a---+----b   |
        //   |   |    |   |
        //   |   h----+---g
        //   e--------f

        const a = [x0, y1, z0];
        const b = [x1, y1, z0];
        const c = [x1, y1, z1];
        const d = [x0, y1, z1];
        const e = [x0, y0, z0];
        const f = [x1, y0, z0];
        const g = [x1, y0, z1];
        const h = [x0, y0, z1];
        const vertices = [a, b, c, d, e, f, g, h];
        geometry.setVertices(vertices.map(point => ({['a_color']: color, ['a_position']: point})));
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

    dispose(renderer: Renderer) {
        renderer.disposeGeometry(this.geometry);
    }

    render(renderer: Renderer) {
        renderer.uniform('u_mMatrix', this.matrix);
        renderer.drawGeometry(this.geometry);
    }

}
