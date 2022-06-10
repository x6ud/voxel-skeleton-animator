import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true, label: 'Use World Space', inputComponent: InputBoolean})
export default class UseWorldSpace extends SkeletonModelNodeComponent<boolean> {
    value = false;
}
