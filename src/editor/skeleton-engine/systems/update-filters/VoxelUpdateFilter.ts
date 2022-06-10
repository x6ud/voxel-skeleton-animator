import {toRaw} from 'vue';
import {createEdgeVertices, createFaceVertices, getVisibleFaces, mergeFaces} from '../../../utils/voxel/geometry';
import Height from '../../components/Height';
import VoxelData from '../../components/VoxelData';
import VoxelEdgeGeometry from '../../components/VoxelEdgeGeometry';
import VoxelFaceGeometry from '../../components/VoxelFaceGeometry';
import Width from '../../components/Width';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {NodeUpdateFilter} from '../NodesUpdateSystem';

const EDGE_COLOR = [0, 0, 0, .1];

export default class VoxelUpdateFilter extends NodeUpdateFilter {

    update(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const voxel = node.getComponent(VoxelData);
        if (!voxel) {
            return;
        }
        const faceGeometry = node.getComponent(VoxelFaceGeometry);
        const edgeGeometry = node.getComponent(VoxelEdgeGeometry);
        if (!faceGeometry?.dirty && !edgeGeometry?.dirty) {
            return;
        }
        const offsetY = (node.getValueOrElse(Height, 0) % 2) * -0.5;
        const offsetZ = (node.getValueOrElse(Width, 0) % 2) * -0.5;
        const faces = getVisibleFaces(toRaw(voxel.value));
        if (edgeGeometry) {
            const edgeVertices = createEdgeVertices(faces, EDGE_COLOR, 0, offsetY, offsetZ);
            edgeGeometry.value.setVertices(edgeVertices.vertices);
            edgeGeometry.value.indices = edgeVertices.indices;
            engine.renderer.updateGeometryVertices(edgeGeometry.value);
            edgeGeometry.dirty = false;
        }
        if (faceGeometry) {
            mergeFaces(faces);
            const faceVertices = createFaceVertices(faces, 0, offsetY, offsetZ);
            faceGeometry.value.setVertices(faceVertices.vertices);
            faceGeometry.value.indices = faceVertices.indices;
            engine.renderer.updateGeometryVertices(faceGeometry.value);
            faceGeometry.dirty = false;
        }
    }

}