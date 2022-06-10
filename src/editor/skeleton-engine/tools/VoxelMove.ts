import {vec3} from 'gl-matrix';
import {setBufferVec4FromNum} from '../../utils/buffer';
import {voxelTranslate} from '../../utils/voxel/data';
import Visible from '../components/Visible';
import VoxelData from '../components/VoxelData';
import Arrow from '../../utils/meshes/Arrow';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import SkeletonEngineTool from './SkeletonEngineTool';
import icon from './voxel-move.png';

const NORMAL_COLOR = [1, 1, 1, 1];
const ACTIVE_COLOR = [1.5, 1.5, 1.5, 1];

const _vecScale = vec3.create();
const _vecType = new Float32Array(4);
const _vecId = new Float32Array(4);

export default class VoxelMove extends SkeletonEngineTool {

    name = VoxelMove.name;
    label = 'Move Voxels';
    icon = icon;

    private readonly arrowXP = new Arrow();
    private readonly arrowYP = new Arrow();
    private readonly arrowZP = new Arrow();
    private readonly arrowXN = new Arrow();
    private readonly arrowYN = new Arrow();
    private readonly arrowZN = new Arrow();
    private handlerVisible: boolean = false;

    constructor() {
        super();
        this.arrowXP.color = this.arrowXN.color = [0xF5 / 0xff, 0x6C / 0xff, 0x6C / 0xff, 1];
        this.arrowYP.color = this.arrowYN.color = [0x67 / 0xff, 0xC2 / 0xff, 0x3A / 0xff, 1];
        this.arrowZP.color = this.arrowZN.color = [0x40 / 0xff, 0x9E / 0xff, 0xFF / 0xff, 1];
        this.arrowXP.shaft = this.arrowYP.shaft = this.arrowZP.shaft
            = this.arrowXN.shaft = this.arrowYN.shaft = this.arrowZN.shaft = false;
        this.arrowXP.length = this.arrowYP.length = this.arrowZP.length
            = this.arrowXN.length = this.arrowYN.length = this.arrowZN.length = 4;
    }

    onPreSolve(engine: SkeletonEngine): void {
        this.handlerVisible = false;
        const selected = engine.selectedNode;
        if (!selected) {
            return;
        }
        if (!selected.getValueOrElse(Visible, true)) {
            return;
        }
        const voxelData = selected.getComponent(VoxelData);
        if (!voxelData) {
            return;
        }
        const scale = vec3.distance(engine.camera.target, engine.camera.position) / 30;
        vec3.set(_vecScale, scale, scale, scale);
        this.arrowXP.matrix = this.arrowYP.matrix = this.arrowZP.matrix
            = this.arrowXN.matrix = this.arrowYN.matrix = this.arrowZN.matrix
            = selected.getWorldMatrix();
        this.arrowYP.rotateZ(Math.PI / 2);
        this.arrowZP.rotateY(-Math.PI / 2);
        this.arrowXN.rotateZ(-Math.PI);
        this.arrowYN.rotateZ(Math.PI / 2 - Math.PI);
        this.arrowZN.rotateY(-Math.PI / 2 - Math.PI);
        this.arrowXP.scale = _vecScale;
        this.arrowYP.scale = _vecScale;
        this.arrowZP.scale = _vecScale;
        this.arrowXN.scale = _vecScale;
        this.arrowYN.scale = _vecScale;
        this.arrowZN.scale = _vecScale;
        this.handlerVisible = true;
    }

    onRender(engine: SkeletonEngine): void {
        if (!this.handlerVisible) {
            return;
        }
        const renderer = engine.renderer;
        renderer.depthTest(false);
        renderer.useShader(engine.plainShader);
        renderer.blendMode(renderer.BLEND_MODE_PIGMENT);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        uniformColor(engine, SkeletonObjectType.VOXEL_MOVE_X_P);
        this.arrowXP.render(renderer);
        uniformColor(engine, SkeletonObjectType.VOXEL_MOVE_Y_P);
        this.arrowYP.render(renderer);
        uniformColor(engine, SkeletonObjectType.VOXEL_MOVE_Z_P);
        this.arrowZP.render(renderer);
        uniformColor(engine, SkeletonObjectType.VOXEL_MOVE_X_N);
        this.arrowXN.render(renderer);
        uniformColor(engine, SkeletonObjectType.VOXEL_MOVE_Y_N);
        this.arrowYN.render(renderer);
        uniformColor(engine, SkeletonObjectType.VOXEL_MOVE_Z_N);
        this.arrowZN.render(renderer);
    }

    onRenderPicking(engine: SkeletonEngine): void {
        if (!this.handlerVisible) {
            return;
        }
        const renderer = engine.renderer;
        renderer.depthTest(false);
        renderer.useShader(engine.pickingShader);
        renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        setBufferVec4FromNum(_vecId, 0, engine.selectedNode?.id || 0);
        renderer.uniform('u_id', _vecId);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.VOXEL_MOVE_X_P);
        renderer.uniform('u_type', _vecType);
        this.arrowXP.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.VOXEL_MOVE_Y_P);
        renderer.uniform('u_type', _vecType);
        this.arrowYP.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.VOXEL_MOVE_Z_P);
        renderer.uniform('u_type', _vecType);
        this.arrowZP.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.VOXEL_MOVE_X_N);
        renderer.uniform('u_type', _vecType);
        this.arrowXN.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.VOXEL_MOVE_Y_N);
        renderer.uniform('u_type', _vecType);
        this.arrowYN.render(renderer);
        setBufferVec4FromNum(_vecType, 0, SkeletonObjectType.VOXEL_MOVE_Z_N);
        renderer.uniform('u_type', _vecType);
        this.arrowZN.render(renderer);
    }

    onPostSolve(engine: SkeletonEngine): void {
        if (engine.input.mouseLeftDownThisFrame) {
            const selected = engine.selectedNode;
            if (!selected) {
                return;
            }
            const voxelData = selected.getComponent(VoxelData);
            if (!voxelData) {
                return;
            }
            let dx = 0;
            let dy = 0;
            let dz = 0;
            switch (engine.draggingObjectType) {
                case SkeletonObjectType.VOXEL_MOVE_X_P:
                    dx = 1;
                    break;
                case SkeletonObjectType.VOXEL_MOVE_Y_P:
                    dy = 1;
                    break;
                case SkeletonObjectType.VOXEL_MOVE_Z_P:
                    dz = 1;
                    break;
                case SkeletonObjectType.VOXEL_MOVE_X_N:
                    dx = -1;
                    break;
                case SkeletonObjectType.VOXEL_MOVE_Y_N:
                    dy = -1;
                    break;
                case SkeletonObjectType.VOXEL_MOVE_Z_N:
                    dz = -1;
                    break;
                default:
                    return;
            }
            const value = voxelTranslate(voxelData.value, dx, dy, dz);
            engine.onSetNodeValues([{node: selected, component: VoxelData, value}]);
        }
    }

}

function uniformColor(engine: SkeletonEngine, type: SkeletonObjectType) {
    const renderer = engine.renderer;
    if (engine.hoveredObjectType === type || engine.draggingObjectType === type) {
        renderer.uniform('u_color', ACTIVE_COLOR);
    } else {
        renderer.uniform('u_color', NORMAL_COLOR);
    }
}
