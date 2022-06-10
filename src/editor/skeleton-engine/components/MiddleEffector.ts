import InputVec3 from '../../components/input/InputVec3/InputVec3.vue';
import {mirrorVec3, interpVec3} from '../../utils/geometry/math';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({
    storable: true,
    cloneable: true,
    label: 'Middle Effector',
    inputComponent: InputVec3,
    flipFunc: mirrorVec3,
    interpFunc: interpVec3,
})
export default class MiddleEffector extends SkeletonModelNodeComponent<[number, number, number]> {
    value: [number, number, number] = [0, 0, 0];
}
