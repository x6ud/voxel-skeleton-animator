import Geometry from '../../../common/render/Geometry';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class BoundingBoxEdgeGeometry extends SkeletonModelNodeComponent<Geometry> {
    value = new Geometry(Geometry.TYPE_LINES, true);
    dirty = true;
}
