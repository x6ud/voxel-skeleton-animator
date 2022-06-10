import EndEffector from '../components/EndEffector';
import EndEffectorHandler from '../components/EndEffectorHandler';
import InternalIkChain from '../components/InternalIkChain';
import LocalMatrix from '../components/LocalMatrix';
import MiddleEffector from '../components/MiddleEffector';
import MiddleEffectorHandler from '../components/MiddleEffectorHandler';
import MirrorNodeId from '../components/MirrorNodeId';
import Name from '../components/Name';
import PreventSpin from '../components/PreventSpin';
import Rotation from '../components/Rotation';
import Translation from '../components/Translation';
import TranslationHandler from '../components/TranslationHandler';
import UseWorldSpace from '../components/UseWorldSpace';
import WorldMatrix from '../components/WorldMatrix';
import {registerNodeDef} from '../node-defs';
import SkeletonModelNodeDef from '../SkeletonModelNodeDef';

@registerNodeDef({canBeRoot: true})
export default class IkChain extends SkeletonModelNodeDef {
    name = IkChain.name;
    label = 'IK Chain';
    components = [
        Name,
        Translation,
        Rotation,
        LocalMatrix,
        WorldMatrix,
        MiddleEffector,
        EndEffector,
        InternalIkChain,
        PreventSpin,
        UseWorldSpace,
        TranslationHandler,
        MiddleEffectorHandler,
        EndEffectorHandler,
        MirrorNodeId,
    ];
    validChildTypes = ['IkChainNode'];
    defaultValues = {[MiddleEffector.name]: [0, 1, 0], [EndEffector.name]: [1, 0, 0], [PreventSpin.name]: false};
}