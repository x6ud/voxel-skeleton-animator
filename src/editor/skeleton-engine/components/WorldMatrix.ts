import {mat4} from 'gl-matrix';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class WorldMatrix extends SkeletonModelNodeComponent<mat4> {
    value = mat4.create();
    dirty = true;
}
