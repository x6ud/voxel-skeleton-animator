import Geometry from '../../../common/render/Geometry';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class VoxelEdgeGeometry extends SkeletonModelNodeComponent<Geometry> {
    value = new Geometry(Geometry.TYPE_LINES);
    dirty = true;
}
