import Cursor from './tools/Cursor';
import MoveLocal from './tools/MoveLocal';
import RotateLocal from './tools/RotateLocal';
import Scale from './tools/Scale';
import SkeletonEngineTool from './tools/SkeletonEngineTool';
import VoxelBox from './tools/VoxelBox';
import VoxelBrush from './tools/VoxelBrush';
import VoxelBucket from './tools/VoxelBucket';
import VoxelMove from './tools/VoxelMove';
import VoxelPen from './tools/VoxelPen';
import VoxelPicker from './tools/VoxelPicker';
import VoxelRangeBrush from './tools/VoxelRangeBrush';

export const skeletonModelerTools: { [name: string]: SkeletonEngineTool } = {
    [Cursor.name]: new Cursor(),
    [MoveLocal.name]: new MoveLocal(),
    [RotateLocal.name]: new RotateLocal(),
    [Scale.name]: new Scale(),
    [VoxelPen.name]: new VoxelPen(),
    [VoxelBox.name]: new VoxelBox(),
    [VoxelBrush.name]: new VoxelBrush(),
    [VoxelRangeBrush.name]: new VoxelRangeBrush(),
    [VoxelBucket.name]: new VoxelBucket(),
    [VoxelPicker.name]: new VoxelPicker(),
    [VoxelMove.name]: new VoxelMove(),
};

export const skeletonAnimatorTools: { [name: string]: SkeletonEngineTool } = {
    [Cursor.name]: skeletonModelerTools[Cursor.name],
    [MoveLocal.name]: skeletonModelerTools[MoveLocal.name],
    [RotateLocal.name]: skeletonModelerTools[RotateLocal.name],
};