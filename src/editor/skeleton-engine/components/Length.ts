import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true, label: 'Length', inputComponent: InputNumber})
export default class Length extends SkeletonModelNodeComponent<number> {
    value = 0;
}
