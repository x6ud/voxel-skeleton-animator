import {mat4, vec3} from 'gl-matrix';
import {getVoxel, Voxels} from '../../utils/voxel/data';
import {gridHash} from '../../utils/voxel/hash';
import {raycastVoxel} from '../../utils/voxel/raycast';
import Height from '../components/Height';
import VoxelData from '../components/VoxelData';
import Width from '../components/Width';
import CubeEdge from '../../utils/meshes/CubeEdge';
import SkeletonEngine from '../SkeletonEngine';
import SkeletonModelNode from '../SkeletonModelNode';
import {SkeletonObjectType} from '../SkeletonObjectType';
import SkeletonEngineTool from './SkeletonEngineTool';
import icon from './voxel-picker.png';

const INDICATOR_COLOR = [0xff / 0xff, 0xff / 0xff, 0xff / 0xff, 1];

const ray0 = vec3.create();
const ray1 = vec3.create();
const position = vec3.create();
const invMat = mat4.create();
const mat = mat4.create();

export default class VoxelPicker extends SkeletonEngineTool {

    name = VoxelPicker.name;
    label = 'Color Picker';
    icon = icon;

    private editingVoxels: Voxels = new Map();
    private offsetY = 0;
    private offsetZ = 0;
    private readonly isVoxelExists: (x: number, y: number, z: number) => boolean = function (this: VoxelPicker, x: number, y: number, z: number) {
        return this.editingVoxels.has(gridHash(x, y, z));
    }.bind(this);
    private valid = false;
    private position = vec3.create();
    private readonly cubeEdge = new CubeEdge();

    onPreSolve(engine: SkeletonEngine): void {
        this.valid = false;
        const selected = selectPointingNode(engine);
        if (!selected) {
            return;
        }
        const voxelData = selected.getComponent(VoxelData);
        if (!voxelData) {
            this.editingVoxels.clear();
            return;
        }
        this.offsetY = (selected.getValueOrElse(Height, 0) % 2) * -0.5;
        this.offsetZ = (selected.getValueOrElse(Width, 0) % 2) * -0.5;
        this.editingVoxels = new Map(voxelData.value);
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
        );
    }

    onRender(engine: SkeletonEngine): void {
        if (!this.valid) {
            return;
        }
        const selected = selectPointingNode(engine);
        if (!selected) {
            return;
        }
        const renderer = engine.renderer;
        renderer.useShader(engine.lineShader);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        renderer.uniform('u_color', INDICATOR_COLOR);
        renderer.uniform('u_zBias', 0.0002);
        vec3.copy(position, this.position);
        position[1] += this.offsetY;
        position[2] += this.offsetZ;
        mat4.translate(mat, selected.getWorldMatrix(), position);
        this.cubeEdge.matrix = mat;
        this.cubeEdge.render(renderer);
    }

    onRenderPicking(engine: SkeletonEngine): void {
    }

    onPostSolve(engine: SkeletonEngine): void {
        const selected = selectPointingNode(engine);
        if (!selected) {
            return;
        }
        if (!this.valid) {
            return;
        }
        const color = getVoxel(this.editingVoxels, this.position[0], this.position[1], this.position[2]);
        if (color == null) {
            return;
        }
        if (engine.input.mouseLeft) {
            engine.color1 = color;
        }
        if (engine.input.mouseRight) {
            engine.color2 = color;
            engine.mouseRightAsEraser = false;
        }
    }

}

function selectPointingNode(engine: SkeletonEngine): SkeletonModelNode | null {
    let node: SkeletonModelNode | null = null;
    if (engine.hoveredObjectType === SkeletonObjectType.VOXEL && engine.hoveredObjectId) {
        node = engine.getNode(engine.hoveredObjectId, engine.activeModel);
        if (engine.input.mouseLeft && engine.selectedNode !== node) {
            engine.onSelectNode(node.id);
        }
    }
    return node;
}
