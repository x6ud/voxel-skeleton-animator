import {vec3} from 'gl-matrix';
import Class from '../../../common/type/Class';
import {closestPointsBetweenTwoLines} from '../../utils/geometry/math';
import Quad from '../../utils/meshes/Quad';
import BoundingBoxPickingGeometry from '../components/BoundingBoxPickingGeometry';
import Height from '../components/Height';
import Length from '../components/Length';
import Width from '../components/Width';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import icon from './scale.png';
import SkeletonEngineTool from './SkeletonEngineTool';

const INDICATOR_COLOR: [number, number, number, number] = [1, .25, .3, 1];

const _p0: [number, number, number] = [0, 0, 0];
const _p1: [number, number, number] = [0, 0, 0];
const _p2: [number, number, number] = [0, 0, 0];
const _p3: [number, number, number] = [0, 0, 0];

export default class Scale extends SkeletonEngineTool {

    name = Scale.name;
    label = 'Resize Box';
    icon = icon;
    private readonly quad = new Quad();
    private readonly nodePosition = vec3.create();
    private readonly normal = vec3.create();
    private readonly dragStartMousePosition = vec3.create();
    private readonly mousePosition = vec3.create();
    private readonly offset = vec3.create();
    private componentClass: Class<Width | Height | Length> = Width;
    private dragStartValue = 0;

    onPreSolve(engine: SkeletonEngine): void {
    }

    onRender(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        let type = engine.hoveredObjectType;
        let id = engine.hoveredObjectId;
        if (engine.draggingObjectType && engine.draggingObjectId) {
            type = engine.draggingObjectType;
            id = engine.draggingObjectId;
        }
        if (type >= SkeletonObjectType.BOUNDING_BOX_FACE_0_BK
            && type <= SkeletonObjectType.BOUNDING_BOX_FACE_5_LF
            && id > 0
        ) {
            renderer.blendMode(renderer.BLEND_MODE_LIGHT);
            renderer.useShader(engine.plainShader);
            renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
            renderer.uniform('u_color', INDICATOR_COLOR);

            const node = engine.getNode(id, engine.activeModel);
            const width = node.getValueOrElse(Width, 0);
            const height = node.getValueOrElse(Height, 0);
            const length = node.getValueOrElse(Length, 0);
            const w = width / 2;
            const h = height / 2;

            switch (type) {
                case SkeletonObjectType.BOUNDING_BOX_FACE_0_BK: {
                    vec3.set(_p0, 0, +h, -w);
                    vec3.set(_p1, 0, -h, -w);
                    vec3.set(_p2, 0, -h, +w);
                    vec3.set(_p3, 0, +h, +w);
                }
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_1_FT: {
                    vec3.set(_p0, length, +h, +w);
                    vec3.set(_p1, length, -h, +w);
                    vec3.set(_p2, length, -h, -w);
                    vec3.set(_p3, length, +h, -w);
                }
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_2_TP: {
                    vec3.set(_p0, 0, +h, +w);
                    vec3.set(_p1, length, +h, +w);
                    vec3.set(_p2, length, +h, -w);
                    vec3.set(_p3, 0, +h, -w);
                }
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_3_BT: {
                    vec3.set(_p0, length, -h, +w);
                    vec3.set(_p1, 0, -h, +w);
                    vec3.set(_p2, 0, -h, -w);
                    vec3.set(_p3, length, -h, -w);
                }
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_4_RG: {
                    vec3.set(_p0, 0, +h, +w);
                    vec3.set(_p1, 0, -h, +w);
                    vec3.set(_p2, length, -h, +w);
                    vec3.set(_p3, length, +h, +w);
                }
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_5_LF: {
                    vec3.set(_p0, length, +h, -w);
                    vec3.set(_p1, length, -h, -w);
                    vec3.set(_p2, 0, -h, -w);
                    vec3.set(_p3, 0, +h, -w);
                }
                    break;
            }

            const quad = this.quad;
            quad.p0 = _p0;
            quad.p1 = _p1;
            quad.p2 = _p2;
            quad.p3 = _p3;
            quad.matrix = node.getWorldMatrix();
            quad.render(renderer);
        }
    }

    onRenderPicking(engine: SkeletonEngine): void {
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const boundingBoxPickingGeometry = selected.getComponent(BoundingBoxPickingGeometry);
        if (boundingBoxPickingGeometry) {
            engine.renderer.useShader(engine.pickingMeshShader);
            engine.renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
            engine.renderer.uniform('u_mMatrix', selected.getWorldMatrix());
            engine.renderer.drawGeometry(boundingBoxPickingGeometry.value);
        }
    }

    onPostSolve(engine: SkeletonEngine): void {
        if (engine.draggingObjectType >= SkeletonObjectType.BOUNDING_BOX_FACE_0_BK
            && engine.draggingObjectType <= SkeletonObjectType.BOUNDING_BOX_FACE_5_LF
            && engine.selectedNode
            && engine.selectedNode.id === engine.draggingObjectId
        ) {
            const normal = this.normal;
            const node = engine.selectedNode;
            const nodePosition = this.nodePosition;
            const mousePosition = this.mousePosition;
            const dragStartMousePosition = this.dragStartMousePosition;
            if (engine.input.mouseLeftDownThisFrame) {
                const worldMatrix = node.getWorldMatrix();
                vec3.set(nodePosition, 0, 0, 0);
                vec3.transformMat4(nodePosition, nodePosition, worldMatrix);
                switch (engine.draggingObjectType) {
                    case SkeletonObjectType.BOUNDING_BOX_FACE_0_BK:
                        vec3.set(normal, +1, 0, 0);
                        this.componentClass = Length;
                        this.dragStartValue = node.getValue(Length);
                        break;
                    case SkeletonObjectType.BOUNDING_BOX_FACE_1_FT:
                        vec3.set(normal, +1, 0, 0);
                        this.componentClass = Length;
                        this.dragStartValue = node.getValue(Length);
                        break;
                    case SkeletonObjectType.BOUNDING_BOX_FACE_2_TP:
                        vec3.set(normal, 0, +1, 0);
                        this.componentClass = Height;
                        this.dragStartValue = node.getValue(Height);
                        break;
                    case SkeletonObjectType.BOUNDING_BOX_FACE_3_BT:
                        vec3.set(normal, 0, -1, 0);
                        this.componentClass = Height;
                        this.dragStartValue = node.getValue(Height);
                        break;
                    case SkeletonObjectType.BOUNDING_BOX_FACE_4_RG:
                        vec3.set(normal, 0, 0, +1);
                        this.componentClass = Width;
                        this.dragStartValue = node.getValue(Width);
                        break;
                    case SkeletonObjectType.BOUNDING_BOX_FACE_5_LF:
                        vec3.set(normal, 0, 0, -1);
                        this.componentClass = Width;
                        this.dragStartValue = node.getValue(Width);
                        break;
                }
                vec3.transformMat4(normal, normal, worldMatrix);
                vec3.sub(normal, normal, nodePosition);
                vec3.normalize(normal, normal);
                closestPointsBetweenTwoLines(
                    null,
                    dragStartMousePosition,
                    nodePosition[0],
                    nodePosition[1],
                    nodePosition[2],
                    normal[0],
                    normal[1],
                    normal[2],
                    engine.mouseRay0[0],
                    engine.mouseRay0[1],
                    engine.mouseRay0[2],
                    engine.mouseNormal[0],
                    engine.mouseNormal[1],
                    engine.mouseNormal[2],
                );
                return;
            }
            closestPointsBetweenTwoLines(
                null,
                mousePosition,
                nodePosition[0],
                nodePosition[1],
                nodePosition[2],
                normal[0],
                normal[1],
                normal[2],
                engine.mouseRay0[0],
                engine.mouseRay0[1],
                engine.mouseRay0[2],
                engine.mouseNormal[0],
                engine.mouseNormal[1],
                engine.mouseNormal[2],
            );
            const offset = this.offset;
            vec3.sub(offset, mousePosition, dragStartMousePosition);
            let det = vec3.dot(offset, normal);
            if (this.componentClass !== Length) {
                det *= 2;
            }
            let value = Math.max(0, this.dragStartValue + det);
            if (engine.input.isKeyPressed('Shift')) {
                const step = 1.0;
                value = Math.round(value / step) * step;
            }
            engine.onSetNodeValues([{node, component: this.componentClass, value}]);
        }
    }

}
