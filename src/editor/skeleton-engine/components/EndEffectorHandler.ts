import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true, label: 'End Effector Handler', inputComponent: InputBoolean})
export default class EndEffectorHandler extends SkeletonModelNodeComponent<boolean> {
    value = true;
}
