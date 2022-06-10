import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true})
export default class Visible extends SkeletonModelNodeComponent<boolean> {
    value = true;
}
