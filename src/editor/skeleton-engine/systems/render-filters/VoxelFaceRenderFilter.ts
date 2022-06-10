import {vec3} from 'gl-matrix';
import VoxelFaceGeometry from '../../components/VoxelFaceGeometry';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import VoxelBox from '../../tools/VoxelBox';
import VoxelBrush from '../../tools/VoxelBrush';
import VoxelBucket from '../../tools/VoxelBucket';
import VoxelMove from '../../tools/VoxelMove';
import VoxelPen from '../../tools/VoxelPen';
import VoxelRangeBrush from '../../tools/VoxelRangeBrush';
import {NodeRenderFilter} from '../NodesRenderSystem';

const UNSELECTED_COLOR = [1, 1, 1, .75];
const SELECTED_COLOR = [1, 1, 1, 1];
const minBrightness = 0.5;
const incBrightness = 0.25;
const lightDirection = vec3.fromValues(0, -1, 0);

const voxelTools = [VoxelPen.name, VoxelBox.name, VoxelBrush.name, VoxelRangeBrush.name, VoxelBucket.name, VoxelMove.name];

export default class VoxelFaceRenderFilter extends NodeRenderFilter {

    private highlightSelected = false;

    begin(engine: SkeletonEngine): boolean {
        this.highlightSelected = voxelTools.includes(engine.tool) && !!engine.selectedNode;

        vec3.sub(lightDirection, engine.camera.target, engine.camera.position);
        vec3.normalize(lightDirection, lightDirection);

        engine.renderer.useShader(engine.directionalLightShader);
        engine.renderer.uniform('u_pvMatrix', engine.camera.pvMatrix);
        engine.renderer.uniform('u_lightDirection', lightDirection);
        engine.renderer.uniform('u_minBrightness', minBrightness);
        engine.renderer.uniform('u_incBrightness', incBrightness);
        if (!this.highlightSelected) {
            engine.renderer.uniform('u_color', SELECTED_COLOR);
        }

        return true;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        const voxelFace = node.getComponent(VoxelFaceGeometry);
        if (voxelFace) {
            if (this.highlightSelected) {
                engine.renderer.uniform('u_color', node === engine.selectedNode ? SELECTED_COLOR : UNSELECTED_COLOR);
            }
            engine.renderer.uniform('u_mMatrix', node.getWorldMatrix());
            engine.renderer.drawGeometry(voxelFace.value);
        }
    }

    end(engine: SkeletonEngine): void {
    }

}