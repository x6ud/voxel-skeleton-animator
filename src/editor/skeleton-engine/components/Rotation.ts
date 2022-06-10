import InputRotation from '../../components/input/InputRotation/InputRotation.vue';
import {mirrorQuat, interpQuat} from '../../utils/geometry/math';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({
    storable: true,
    cloneable: true,
    label: 'Rotation',
    inputComponent: InputRotation,
    flipFunc: mirrorQuat,
    interpFunc: interpQuat,
})
export default class Rotation extends SkeletonModelNodeComponent<[number, number, number, number]> {
    value: [number, number, number, number] = [0, 0, 0, 1];
}
