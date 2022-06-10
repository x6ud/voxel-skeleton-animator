import Geometry from '../../../common/render/Geometry';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class VoxelFaceGeometry extends SkeletonModelNodeComponent<Geometry>{
    value = new Geometry();
    dirty = true;
}
