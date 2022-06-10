import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';

export default class Axes extends Transform3D {

    private geometry: Geometry;

    constructor(size: number) {
        super();
        const geometry = this.geometry = new Geometry(Geometry.TYPE_LINES);
        const vertices: { 'a_position': number[], 'a_color': number[] } [] = [];
        const indices: number[] = [];
        const xAxisColor = [0xcc / 0xff, 0x0d / 0xff, 0x3d / 0xff, 1];
        const yAxisColor = [0xcc / 0xff, 0xcc / 0xff, 0xcc / 0xff, .25];
        const zAxisColor = [0x00 / 0xff, 0x7f / 0xff, 0xb1 / 0xff, 1];

        function line(v1: number[], v2: number[], color: number[]) {
            indices.push(vertices.push({'a_position': v1, 'a_color': color}) - 1);
            indices.push(vertices.push({'a_position': v2, 'a_color': color}) - 1);
        }

        line([-size * .5, 0, 0], [+size * .5, 0, 0], xAxisColor);
        line([0, -size * .5, 0], [0, +size * .5, 0], yAxisColor);
        line([0, 0, -size * .5], [0, 0, +size * .5], zAxisColor);

        geometry.setVertices(vertices);
        geometry.indices = indices;
    }

    render(renderer: Renderer) {
        renderer.uniform('u_mMatrix', this.matrix);
        renderer.drawGeometry(this.geometry);
    }

    dispose(renderer: Renderer) {
        renderer.disposeGeometry(this.geometry);
    }

}