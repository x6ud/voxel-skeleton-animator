import LocalMatrix from '../components/LocalMatrix';
import MirrorNodeId from '../components/MirrorNodeId';
import Name from '../components/Name';
import Rotation from '../components/Rotation';
import Translation from '../components/Translation';
import Visible from '../components/Visible';
import WorldMatrix from '../components/WorldMatrix';
import {registerNodeDef} from '../node-defs';
import SkeletonModelNodeDef from '../SkeletonModelNodeDef';

@registerNodeDef({canBeRoot: true})
export default class Container extends SkeletonModelNodeDef {
    name = Container.name;
    label = 'Container';
    components = [
        Name,
        Visible,
        Translation,
        Rotation,
        LocalMatrix,
        WorldMatrix,
        MirrorNodeId,
    ];
    validChildTypes = ['Container', 'BodyPart', 'IkChain'];
}