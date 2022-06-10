import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true, label: 'Mirror Symmetry', inputComponent: InputBoolean})
export default class MirrorSymmetry extends SkeletonModelNodeComponent<boolean> {
    value = false;
}
