import BoundingBoxEdgeGeometry from '../components/BoundingBoxEdgeGeometry';
import BoundingBoxPickingGeometry from '../components/BoundingBoxPickingGeometry';
import Height from '../components/Height';
import Length from '../components/Length';
import LocalMatrix from '../components/LocalMatrix';
import MirrorNodeId from '../components/MirrorNodeId';
import MirrorSymmetry from '../components/MirrorSymmetry';
import Name from '../components/Name';
import Rotation from '../components/Rotation';
import Translation from '../components/Translation';
import Visible from '../components/Visible';
import VoxelData from '../components/VoxelData';
import VoxelEdgeGeometry from '../components/VoxelEdgeGeometry';
import VoxelFaceGeometry from '../components/VoxelFaceGeometry';
import Width from '../components/Width';
import WorldMatrix from '../components/WorldMatrix';
import {registerNodeDef} from '../node-defs';
import SkeletonModelNodeDef from '../SkeletonModelNodeDef';

@registerNodeDef({canBeRoot: true})
export default class BodyPart extends SkeletonModelNodeDef {
    name = BodyPart.name;
    label = 'Body Part';
    components = [
        Name,
        Visible,
        Translation,
        Rotation,
        LocalMatrix,
        WorldMatrix,
        Length,
        Width,
        Height,
        BoundingBoxEdgeGeometry,
        BoundingBoxPickingGeometry,
        VoxelData,
        VoxelFaceGeometry,
        VoxelEdgeGeometry,
        MirrorSymmetry,
        MirrorNodeId,
    ];
    validChildTypes = ['BodyPart', 'Container', 'IkChain'];
    defaultValues = {
        [Width.name]: 1,
        [Height.name]: 1,
        [Length.name]: 1,
    };
}