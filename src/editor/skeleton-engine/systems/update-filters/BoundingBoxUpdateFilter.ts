import Geometry from '../../../../common/render/Geometry';
import {setBufferVec4, setBufferVec4FromNum, setBufferXYZ} from '../../../utils/buffer';
import BoundingBoxEdgeGeometry from '../../components/BoundingBoxEdgeGeometry';
import BoundingBoxPickingGeometry from '../../components/BoundingBoxPickingGeometry';
import Height from '../../components/Height';
import Length from '../../components/Length';
import Width from '../../components/Width';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {SkeletonObjectType} from '../../SkeletonObjectType';
import {NodeUpdateFilter} from '../NodesUpdateSystem';

const WHITE: [number, number, number, number] = [1, 1, 1, 1];
const EDGE_INDICES: number[] = [
    0, 1,
    1, 2,
    2, 3,
    3, 0,
    4, 5,
    5, 6,
    6, 7,
    7, 4,
    0, 4,
    1, 5,
    2, 6,
    3, 7,
];
const PICKING_INDICES: number[] = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
];

export default class BoundingBoxUpdateFilter extends NodeUpdateFilter {

    update(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const width = node.getValueOrElse(Width, 0);
        const height = node.getValueOrElse(Height, 0);
        const length = node.getValueOrElse(Length, 0);
        const w = width / 2;
        const h = height / 2;

        const edge = node.getComponent(BoundingBoxEdgeGeometry);
        if (edge?.dirty) {
            const geometry = edge.value;
            const aPosition = geometry.attributes[0] = geometry.attributes[0] || new Geometry.Attribute(
                'a_position',
                3,
                new Float32Array(3 * 8)
            );
            const aColor = geometry.attributes[1] = geometry.attributes[1] || new Geometry.Attribute(
                'a_color',
                4,
                new Float32Array(4 * 8)
            );
            setBufferXYZ(aPosition.vertices, 0, 0, +h, -w);
            setBufferXYZ(aPosition.vertices, 1, 0, +h, +w);
            setBufferXYZ(aPosition.vertices, 2, 0, -h, +w);
            setBufferXYZ(aPosition.vertices, 3, 0, -h, -w);
            setBufferXYZ(aPosition.vertices, 4, length, +h, -w);
            setBufferXYZ(aPosition.vertices, 5, length, +h, +w);
            setBufferXYZ(aPosition.vertices, 6, length, -h, +w);
            setBufferXYZ(aPosition.vertices, 7, length, -h, -w);
            for (let i = 0; i < 8; ++i) {
                setBufferVec4(aColor.vertices, i, WHITE);
            }
            geometry.indices = EDGE_INDICES;
            engine.renderer.updateGeometryVertices(geometry);
        }

        const picking = node.getComponent(BoundingBoxPickingGeometry);
        if (picking?.dirty) {
            const geometry = picking.value;
            const aPosition = geometry.attributes[0] = geometry.attributes[0] || new Geometry.Attribute(
                'a_position',
                3,
                new Float32Array(3 * 24)
            );
            const aType = geometry.attributes[1] = geometry.attributes[1] || new Geometry.Attribute(
                'a_type',
                4,
                new Float32Array(4 * 24)
            );
            const aId = geometry.attributes[2] = geometry.attributes[2] || new Geometry.Attribute(
                'a_id',
                4,
                new Float32Array(4 * 24)
            );
            // back
            setBufferXYZ(aPosition.vertices, 0, 0, +h, -w);
            setBufferXYZ(aPosition.vertices, 1, 0, -h, -w);
            setBufferXYZ(aPosition.vertices, 2, 0, -h, +w);
            setBufferXYZ(aPosition.vertices, 3, 0, +h, +w);
            setBufferVec4FromNum(aType.vertices, 0, SkeletonObjectType.BOUNDING_BOX_FACE_0_BK);
            setBufferVec4FromNum(aType.vertices, 1, SkeletonObjectType.BOUNDING_BOX_FACE_0_BK);
            setBufferVec4FromNum(aType.vertices, 2, SkeletonObjectType.BOUNDING_BOX_FACE_0_BK);
            setBufferVec4FromNum(aType.vertices, 3, SkeletonObjectType.BOUNDING_BOX_FACE_0_BK);
            setBufferVec4FromNum(aId.vertices, 0, node.id);
            setBufferVec4FromNum(aId.vertices, 1, node.id);
            setBufferVec4FromNum(aId.vertices, 2, node.id);
            setBufferVec4FromNum(aId.vertices, 3, node.id);
            // front
            setBufferXYZ(aPosition.vertices, 4, length, +h, +w);
            setBufferXYZ(aPosition.vertices, 5, length, -h, +w);
            setBufferXYZ(aPosition.vertices, 6, length, -h, -w);
            setBufferXYZ(aPosition.vertices, 7, length, +h, -w);
            setBufferVec4FromNum(aType.vertices, 4, SkeletonObjectType.BOUNDING_BOX_FACE_1_FT);
            setBufferVec4FromNum(aType.vertices, 5, SkeletonObjectType.BOUNDING_BOX_FACE_1_FT);
            setBufferVec4FromNum(aType.vertices, 6, SkeletonObjectType.BOUNDING_BOX_FACE_1_FT);
            setBufferVec4FromNum(aType.vertices, 7, SkeletonObjectType.BOUNDING_BOX_FACE_1_FT);
            setBufferVec4FromNum(aId.vertices, 4, node.id);
            setBufferVec4FromNum(aId.vertices, 5, node.id);
            setBufferVec4FromNum(aId.vertices, 6, node.id);
            setBufferVec4FromNum(aId.vertices, 7, node.id);
            // top
            setBufferXYZ(aPosition.vertices, 8, 0, +h, +w);
            setBufferXYZ(aPosition.vertices, 9, length, +h, +w);
            setBufferXYZ(aPosition.vertices, 10, length, +h, -w);
            setBufferXYZ(aPosition.vertices, 11, 0, +h, -w);
            setBufferVec4FromNum(aType.vertices, 8, SkeletonObjectType.BOUNDING_BOX_FACE_2_TP);
            setBufferVec4FromNum(aType.vertices, 9, SkeletonObjectType.BOUNDING_BOX_FACE_2_TP);
            setBufferVec4FromNum(aType.vertices, 10, SkeletonObjectType.BOUNDING_BOX_FACE_2_TP);
            setBufferVec4FromNum(aType.vertices, 11, SkeletonObjectType.BOUNDING_BOX_FACE_2_TP);
            setBufferVec4FromNum(aId.vertices, 8, node.id);
            setBufferVec4FromNum(aId.vertices, 9, node.id);
            setBufferVec4FromNum(aId.vertices, 10, node.id);
            setBufferVec4FromNum(aId.vertices, 11, node.id);
            // bottom
            setBufferXYZ(aPosition.vertices, 12, length, -h, +w);
            setBufferXYZ(aPosition.vertices, 13, 0, -h, +w);
            setBufferXYZ(aPosition.vertices, 14, 0, -h, -w);
            setBufferXYZ(aPosition.vertices, 15, length, -h, -w);
            setBufferVec4FromNum(aType.vertices, 12, SkeletonObjectType.BOUNDING_BOX_FACE_3_BT);
            setBufferVec4FromNum(aType.vertices, 13, SkeletonObjectType.BOUNDING_BOX_FACE_3_BT);
            setBufferVec4FromNum(aType.vertices, 14, SkeletonObjectType.BOUNDING_BOX_FACE_3_BT);
            setBufferVec4FromNum(aType.vertices, 15, SkeletonObjectType.BOUNDING_BOX_FACE_3_BT);
            setBufferVec4FromNum(aId.vertices, 12, node.id);
            setBufferVec4FromNum(aId.vertices, 13, node.id);
            setBufferVec4FromNum(aId.vertices, 14, node.id);
            setBufferVec4FromNum(aId.vertices, 15, node.id);
            // left
            setBufferXYZ(aPosition.vertices, 16, 0, +h, +w);
            setBufferXYZ(aPosition.vertices, 17, 0, -h, +w);
            setBufferXYZ(aPosition.vertices, 18, length, -h, +w);
            setBufferXYZ(aPosition.vertices, 19, length, +h, +w);
            setBufferVec4FromNum(aType.vertices, 16, SkeletonObjectType.BOUNDING_BOX_FACE_4_RG);
            setBufferVec4FromNum(aType.vertices, 17, SkeletonObjectType.BOUNDING_BOX_FACE_4_RG);
            setBufferVec4FromNum(aType.vertices, 18, SkeletonObjectType.BOUNDING_BOX_FACE_4_RG);
            setBufferVec4FromNum(aType.vertices, 19, SkeletonObjectType.BOUNDING_BOX_FACE_4_RG);
            setBufferVec4FromNum(aId.vertices, 16, node.id);
            setBufferVec4FromNum(aId.vertices, 17, node.id);
            setBufferVec4FromNum(aId.vertices, 18, node.id);
            setBufferVec4FromNum(aId.vertices, 19, node.id);
            // right
            setBufferXYZ(aPosition.vertices, 20, length, +h, -w);
            setBufferXYZ(aPosition.vertices, 21, length, -h, -w);
            setBufferXYZ(aPosition.vertices, 22, 0, -h, -w);
            setBufferXYZ(aPosition.vertices, 23, 0, +h, -w);
            setBufferVec4FromNum(aType.vertices, 20, SkeletonObjectType.BOUNDING_BOX_FACE_5_LF);
            setBufferVec4FromNum(aType.vertices, 21, SkeletonObjectType.BOUNDING_BOX_FACE_5_LF);
            setBufferVec4FromNum(aType.vertices, 22, SkeletonObjectType.BOUNDING_BOX_FACE_5_LF);
            setBufferVec4FromNum(aType.vertices, 23, SkeletonObjectType.BOUNDING_BOX_FACE_5_LF);
            setBufferVec4FromNum(aId.vertices, 20, node.id);
            setBufferVec4FromNum(aId.vertices, 21, node.id);
            setBufferVec4FromNum(aId.vertices, 22, node.id);
            setBufferVec4FromNum(aId.vertices, 23, node.id);

            geometry.indices = PICKING_INDICES;
            engine.renderer.updateGeometryVertices(geometry);
        }
    }

}