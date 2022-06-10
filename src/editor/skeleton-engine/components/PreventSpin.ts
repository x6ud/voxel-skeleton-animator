import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true, label: 'Prevent Spin', inputComponent: InputBoolean})
export default class PreventSpin extends SkeletonModelNodeComponent<boolean> {
    value = false;
}
