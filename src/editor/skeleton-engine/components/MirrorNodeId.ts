import {registerSkeletonModelComponentDef} from '../component-defs';
import SkeletonModelNodeComponent from '../SkeletonModelNodeComponent';

@registerSkeletonModelComponentDef({storable: true})
export default class MirrorNodeId extends SkeletonModelNodeComponent<number> {
    value = 0;
}
