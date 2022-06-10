import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class IkNodeRotation extends SkeletonModelNodeComponent<[number, number, number, number]> {
    value: [number, number, number, number] = [0, 0, 0, 1];
}
