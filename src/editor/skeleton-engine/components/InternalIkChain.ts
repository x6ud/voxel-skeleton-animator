import FabrikChain from '../../utils/ik/FabrikChain';
import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef()
export default class InternalIkChain extends SkeletonModelNodeComponent<FabrikChain> {
    value = new FabrikChain();
    dirty = true;
}
