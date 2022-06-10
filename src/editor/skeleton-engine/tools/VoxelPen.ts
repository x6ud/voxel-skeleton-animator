import {mat4, ReadonlyVec3, vec3} from 'gl-matrix';
import {raycastPlane} from '../../utils/geometry/raycast';
import {setVoxel, Voxels} from '../../utils/voxel/data';
import {gridHash} from '../../utils/voxel/hash';
import {raycastVoxel} from '../../utils/voxel/raycast';
import Height from '../components/Height';
import Length from '../components/Length';
import MirrorSymmetry from '../components/MirrorSymmetry';
import Visible from '../components/Visible';
import VoxelData from '../components/VoxelData';
import Width from '../components/Width';
import VoxelFaceEdge from '../../utils/meshes/VoxelFaceEdge';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import SkeletonEngineTool from './SkeletonEngineTool';
import icon from './voxel-pen.png';

const INDICATOR_COLOR = [0xcc / 0xff, 0x0d / 0xff, 0x3d / 0xff, 1];
const NORMAL_0: ReadonlyVec3 = [+1, 0, 0];
const NORMAL_1: ReadonlyVec3 = [-1, 0, 0];
const NORMAL_2: ReadonlyVec3 = [0, -1, 0];
const NORMAL_3: ReadonlyVec3 = [0, +1, 0];
const NORMAL_4: ReadonlyVec3 = [0, 0, -1];
const NORMAL_5: ReadonlyVec3 = [0, 0, +1];

const ray0 = vec3.create();
const ray1 = vec3.create();
const invMat = mat4.create();
const hoverPanelPoint = vec3.create();
const position = vec3.create();
const normal = vec3.create();

export default class VoxelPen extends SkeletonEngineTool {

    name = VoxelPen.name;
    label = 'Pen';
    icon = icon;

    private offsetY = 0;
    private offsetZ = 0;
    private editingVoxels: Voxels = new Map();
    private readonly isVoxelExists: (x: number, y: number, z: number) => boolean = function (this: VoxelPen, x: number, y: number, z: number) {
        return this.editingVoxels.has(gridHash(x, y, z));
    }.bind(this);
    private valid = false;
    private position = vec3.create();
    private normal = vec3.create();
    private voxelFaceEdge = new VoxelFaceEdge();

    onPreSolve(engine: SkeletonEngine): void {
        this.valid = false;
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        if (!selected.getValueOrElse(Visible, true)) {
            return;
        }
        const voxelData = selected.getComponent(VoxelData);
        if (!voxelData) {
            this.editingVoxels.clear();
            return;
        }
        this.offsetY = (selected.getValueOrElse(Height, 0) % 2) * -0.5;
        this.offsetZ = (selected.getValueOrElse(Width, 0) % 2) * -0.5;
        if (!engine.input.mouseLeft && !engine.input.mouseRight) {
            this.editingVoxels = new Map(voxelData.value);
        }
        mat4.invert(invMat, selected.getWorldMatrix());
        vec3.transformMat4(ray0, engine.mouseRay0, invMat);
        vec3.transformMat4(ray1, engine.mouseRay1, invMat);
        ray0[1] -= this.offsetY;
        ray1[1] -= this.offsetY;
        ray0[2] -= this.offsetZ;
        ray1[2] -= this.offsetZ;
        this.valid = raycastVoxel(
            this.position,
            this.isVoxelExists,
            ray0,
            ray1,
            0,
            undefined,
            this.normal,
        );
        if (this.valid) {
            vec3.add(this.position, this.position, this.normal);
            vec3.negate(this.normal, this.normal);
        } else {
            const length = selected.getValue(Length);
            const height = selected.getValue(Height);
            const width = selected.getValue(Width);
            switch (engine.hoveredObjectType) {
                case SkeletonObjectType.BOUNDING_BOX_FACE_0_BK:
                    vec3.copy(this.normal, NORMAL_0);
                    vec3.set(hoverPanelPoint, 0, 0, 0);
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_1_FT:
                    vec3.copy(this.normal, NORMAL_1);
                    vec3.set(hoverPanelPoint, length, 0, 0);
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_2_TP:
                    vec3.copy(this.normal, NORMAL_2);
                    vec3.set(hoverPanelPoint, length / 2, +height / 2, 0);
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_3_BT:
                    vec3.copy(this.normal, NORMAL_3);
                    vec3.set(hoverPanelPoint, length / 2, -height / 2, 0);
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_4_RG:
                    vec3.copy(this.normal, NORMAL_4);
                    vec3.set(hoverPanelPoint, length / 2, 0, +width / 2);
                    break;
                case SkeletonObjectType.BOUNDING_BOX_FACE_5_LF:
                    vec3.copy(this.normal, NORMAL_5);
                    vec3.set(hoverPanelPoint, length / 2, 0, -width / 2);
                    break;
                default:
                    return;
            }
            raycastPlane(
                this.position,
                ray0[0],
                ray0[1],
                ray0[2],
                ray1[0],
                ray1[1],
                ray1[2],
                hoverPanelPoint[0],
                hoverPanelPoint[1],
                hoverPanelPoint[2],
                this.normal[0],
                this.normal[1],
                this.normal[2],
            );
            const widthHalf = Math.ceil(width / 2);
            const heightHalf = Math.ceil(height / 2);
            this.position[0] = Math.floor(Math.max(0, Math.min(this.position[0], length - 1)));
            this.position[1] = Math.floor(Math.max(-heightHalf, Math.min(this.position[1], heightHalf - 1)));
            this.position[2] = Math.floor(Math.max(-widthHalf, Math.min(this.position[2], widthHalf - 1)));
            vec3.negate(this.normal, this.normal);
            this.valid = true;
        }
    }

    onRender(engine: SkeletonEngine): void {
        if (!this.valid) {
            return;
        }
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const renderer = engine.renderer;
        renderer.useShader(engine.lineShader);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        renderer.uniform('u_mMatrix', selected.getWorldMatrix());
        renderer.uniform('u_color', INDICATOR_COLOR);
        renderer.uniform('u_zBias', 0.0002);
        vec3.copy(position, this.position);
        position[1] += this.offsetY;
        position[2] += this.offsetZ;
        this.voxelFaceEdge.voxelPosition = position;
        this.voxelFaceEdge.faceNormal = this.normal;
        this.voxelFaceEdge.render(renderer);
        if (selected.getValueOrElse(MirrorSymmetry, false)) {
            vec3.copy(position, this.position);
            position[1] += this.offsetY;
            if (this.offsetZ) {
                position[2] = -this.position[2] + this.offsetZ;
            } else {
                position[2] = -position[2] - 1;
            }
            this.voxelFaceEdge.voxelPosition = position;
            vec3.set(normal, this.normal[0], this.normal[1], -this.normal[2]);
            this.voxelFaceEdge.faceNormal = normal;
            this.voxelFaceEdge.render(renderer);
        }
    }

    onRenderPicking(engine: SkeletonEngine): void {
    }

    onPostSolve(engine: SkeletonEngine): void {
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        const voxelData = selected.getComponent(VoxelData);
        if (!voxelData) {
            return;
        }
        if (engine.input.isKeyPressed('Delete')) {
            engine.onSetNodeValues([{node: selected, component: VoxelData, value: new Map()}]);
            return;
        }
        if (!this.valid) {
            return;
        }
        if (engine.input.mouseLeft) {
            const voxels: Voxels = new Map(voxelData.value);
            let modified = setVoxel(voxels, this.position[0], this.position[1], this.position[2], engine.color1);
            if (selected.getValueOrElse(MirrorSymmetry, false)) {
                modified = setVoxel(voxels, this.position[0], this.position[1], -this.position[2] - (this.offsetZ ? 0 : 1), engine.color1) || modified;
            }
            if (modified) {
                engine.onSetNodeValues([{node: selected, component: VoxelData, value: voxels}]);
            }
            return;
        }
        if (engine.input.mouseRight) {
            vec3.copy(position, this.position);
            if (engine.mouseRightAsEraser) {
                vec3.add(position, position, this.normal);
                if (!this.isVoxelExists(position[0], position[1], position[2])) {
                    return;
                }
            }
            const voxels: Voxels = new Map(voxelData.value);
            let modified = setVoxel(voxels, position[0], position[1], position[2], engine.mouseRightAsEraser ? null : engine.color2);
            if (selected.getValueOrElse(MirrorSymmetry, false)) {
                modified = setVoxel(voxels, position[0], position[1], -position[2] - (this.offsetZ ? 0 : 1), engine.mouseRightAsEraser ? null : engine.color2) || modified;
            }
            if (modified) {
                engine.onSetNodeValues([{node: selected, component: VoxelData, value: voxels}]);
            }
            engine.draggingWithMouseRight = true;
            return;
        }
    }

}
