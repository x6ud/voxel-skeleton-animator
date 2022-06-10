import Geometry from '../../../common/render/Geometry';
import Renderer from '../../../common/render/Renderer';
import Transform3D from '../../../common/render/Transform3D';

export default class XZPanelGrid extends Transform3D {

    private geometry: Geometry;

    constructor(size: number, gridSize: number) {
        super();
        const geometry = this.geometry = new Geometry(Geometry.TYPE_LINES);
        const vertices: { 'a_position': number[], 'a_color': number[] } [] = [];
        const indices: number[] = [];
        const gridColor = [.4, .4, .4, 1];

        function line(v1: number[], v2: number[], color: number[]) {
            indices.push(vertices.push({'a_position': v1, 'a_color': color}) - 1);
            indices.push(vertices.push({'a_position': v2, 'a_color': color}) - 1);
        }

        const half = size / 2;
        for (let x = -half; x <= half; ++x) {
            if (x === 0) {
                continue;
            }
            line([x * gridSize, 0, -half * gridSize], [x * gridSize, 0, half * gridSize], gridColor);
        }
        for (let z = -half; z <= half; ++z) {
            if (z === 0) {
                continue;
            }
            line([-half * gridSize, 0, z * gridSize], [half * gridSize, 0, z * gridSize], gridColor);
        }

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