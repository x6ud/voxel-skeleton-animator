import InputString from '../../components/input/InputString/InputString.vue';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true, label: 'Name', inputComponent: InputString})
export default class Name extends SkeletonModelNodeComponent<string> {
    value = '';
}
