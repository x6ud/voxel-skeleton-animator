import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, cloneable: true, label: 'Width', inputComponent: InputNumber})
export default class Width extends SkeletonModelNodeComponent<number> {
    value = 0;
}
