import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class IkNodeTranslation extends SkeletonModelNodeComponent<[number, number, number]> {
    value: [number, number, number] = [0, 0, 0];
}
