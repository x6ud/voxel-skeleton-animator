import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true, label: 'Translation Handler', inputComponent: InputBoolean})
export default class TranslationHandler extends SkeletonModelNodeComponent<boolean> {
    value = true;
}
