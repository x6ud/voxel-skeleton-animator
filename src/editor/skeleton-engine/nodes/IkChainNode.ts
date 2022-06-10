import BoundingBoxEdgeGeometry from '../components/BoundingBoxEdgeGeometry';
import BoundingBoxPickingGeometry from '../components/BoundingBoxPickingGeometry';
import Height from '../components/Height';
import IkNodeRotation from '../components/IkNodeRotation';
import IkNodeTranslation from '../components/IkNodeTranslation';
import Length from '../components/Length';
import LocalMatrix from '../components/LocalMatrix';
import MirrorNodeId from '../components/MirrorNodeId';
import MirrorSymmetry from '../components/MirrorSymmetry';
import Name from '../components/Name';
import TwistAngle from '../components/TwistAngle';
import Visible from '../components/Visible';
import VoxelData from '../components/VoxelData';
import VoxelEdgeGeometry from '../components/VoxelEdgeGeometry';
import VoxelFaceGeometry from '../components/VoxelFaceGeometry';
import Width from '../components/Width';
import WorldMatrix from '../components/WorldMatrix';
import {registerNodeDef} from '../node-defs';
import SkeletonModelNodeDef from '../SkeletonModelNodeDef';

@registerNodeDef()
export default class IkChainNode extends SkeletonModelNodeDef {
    name = IkChainNode.name;
    label = 'IK Chain Node';
    components = [
        Name,
        Visible,
        Length,
        Width,
        Height,
        IkNodeTranslation,
        IkNodeRotation,
        TwistAngle,
        LocalMatrix,
        WorldMatrix,
        BoundingBoxEdgeGeometry,
        BoundingBoxPickingGeometry,
        VoxelData,
        VoxelFaceGeometry,
        VoxelEdgeGeometry,
        MirrorSymmetry,
        MirrorNodeId,
    ];
    validChildTypes = ['IkChain', 'BodyPart', 'Container'];
    defaultValues = {
        [Width.name]: 1,
        [Height.name]: 1,
        [Length.name]: 1,
    };
}