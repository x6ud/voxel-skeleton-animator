import Geometry from '../../../common/render/Geometry';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class BoundingBoxPickingGeometry extends SkeletonModelNodeComponent<Geometry> {
    value = new Geometry(Geometry.TYPE_TRIANGLES, true);
    dirty = true;
}
