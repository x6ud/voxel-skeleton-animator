import InputAngle from '../../components/input/InputAngle/InputAngle.vue';
import {interpAngle} from '../../utils/geometry/math';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({
    storable: true,
    cloneable: true,
    label: 'Twist',
    inputComponent: InputAngle,
    flipFunc: angle => -angle,
    interpFunc: interpAngle,
})
export default class TwistAngle extends SkeletonModelNodeComponent<number> {
    value = 0;
}
