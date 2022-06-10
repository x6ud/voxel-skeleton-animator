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
import BoxEdge from '../../utils/meshes/BoxEdge';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import SkeletonEngineTool from './SkeletonEngineTool';
import icon from './voxel-box.png';

const INDICATOR_COLOR = [0xff / 0xff, 0xff / 0xff, 0xff / 0xff, 1];
const NORMAL_0: ReadonlyVec3 = [+1, 0, 0];
const NORMAL_1: ReadonlyVec3 = [-1, 0, 0];
const NORMAL_2: ReadonlyVec3 = [0, -1, 0];
const NORMAL_3: ReadonlyVec3 = [0, +1, 0];
const NORMAL_4: ReadonlyVec3 = [0, 0, -1];
const NORMAL_5: ReadonlyVec3 = [0, 0, +1];

const ray0 = vec3.create();
const ray1 = vec3.create();
const mat = mat4.create();
const invMat = mat4.create();
const hoverPanelPoint = vec3.create();
const position = vec3.create();

export default class VoxelBox extends SkeletonEngineTool {

    name = VoxelBox.name;
    label = 'Box';
    icon = icon;

    private offsetY = 0;
    private offsetZ = 0;
    private editingVoxels: Voxels = new Map();
    private readonly isVoxelExists: (x: number, y: number, z: number) => boolean = function (this: VoxelBox, x: number, y: number, z: number) {
        return this.editingVoxels.has(gridHash(x, y, z));
    }.bind(this);
    private valid = false;
    private position = vec3.create();
    private normal = vec3.create();
    private boxEdge = new BoxEdge();
    private dragging = false;
    private dragStartPos = vec3.create();
    private mouseLeft = false;

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
        renderer.blendMode(renderer.BLEND_MODE_LIGHT);
        renderer.useShader(engine.lineShader);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        renderer.uniform('u_color', INDICATOR_COLOR);
        renderer.uniform('u_zBias', 0.0002);

        if (this.dragging) {
            position[0] = Math.min(this.position[0], this.dragStartPos[0]);
            position[1] = Math.min(this.position[1], this.dragStartPos[1]);
            position[2] = Math.min(this.position[2], this.dragStartPos[2]);
        } else {
            vec3.copy(position, this.position);
        }
        position[1] += this.offsetY;
        position[2] += this.offsetZ;
        mat4.translate(mat, selected.getWorldMatrix(), position);

        this.boxEdge.x0 = 0;
        this.boxEdge.y0 = 0;
        this.boxEdge.z0 = 0;
        if (this.dragging) {
            this.boxEdge.x1 = Math.abs(this.position[0] - this.dragStartPos[0]) + 1;
            this.boxEdge.y1 = Math.abs(this.position[1] - this.dragStartPos[1]) + 1;
            this.boxEdge.z1 = Math.abs(this.position[2] - this.dragStartPos[2]) + 1;
        } else {
            this.boxEdge.x1 = 1;
            this.boxEdge.y1 = 1;
            this.boxEdge.z1 = 1;
        }

        this.boxEdge.matrix = mat;
        this.boxEdge.render(renderer);
        renderer.blendMode(renderer.BLEND_MODE_PIGMENT);
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
        if (engine.input.mouseLeft || engine.input.mouseRight) {
            if (!this.dragging) {
                if (engine.input.mouseRight) {
                    engine.draggingWithMouseRight = true;
                    this.mouseLeft = false;
                } else {
                    this.mouseLeft = true;
                }
                this.dragging = true;
                vec3.copy(this.dragStartPos, this.position);
            }
        } else if (this.dragging) {
            this.dragging = false;
            const x0 = Math.min(this.position[0], this.dragStartPos[0]);
            const y0 = Math.min(this.position[1], this.dragStartPos[1]);
            const z0 = Math.min(this.position[2], this.dragStartPos[2]);
            const x1 = x0 + Math.abs(this.position[0] - this.dragStartPos[0]);
            const y1 = y0 + Math.abs(this.position[1] - this.dragStartPos[1]);
            const z1 = z0 + Math.abs(this.position[2] - this.dragStartPos[2]);
            const color = this.mouseLeft ? engine.color1 : (engine.mouseRightAsEraser ? null : engine.color2);
            const mirrorSymmetry = selected.getValueOrElse(MirrorSymmetry, false);
            const offsetZ = this.offsetZ ? 0 : 1;
            const voxels: Voxels = new Map(voxelData.value);
            for (let x = x0; x <= x1; ++x) {
                for (let y = y0; y <= y1; ++y) {
                    for (let z = z0; z <= z1; ++z) {
                        setVoxel(voxels, x, y, z, color);
                        if (mirrorSymmetry) {
                            setVoxel(voxels, x, y, -z - offsetZ, color);
                        }
                    }
                }
            }
            engine.onSetNodeValues([{node: selected, component: VoxelData, value: voxels}]);
        }
    }

}
