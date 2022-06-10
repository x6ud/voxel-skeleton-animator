import {mat4, vec3} from 'gl-matrix';
import Texture from '../../../../common/render/Texture';
import {setBufferVec4FromNum} from '../../../utils/buffer';
import EndEffector from '../../components/EndEffector';
import EndEffectorHandler from '../../components/EndEffectorHandler';
import MiddleEffector from '../../components/MiddleEffector';
import MiddleEffectorHandler from '../../components/MiddleEffectorHandler';
import TranslationHandler from '../../components/TranslationHandler';
import UseWorldSpace from '../../components/UseWorldSpace';
import IkChain from '../../nodes/IkChain';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import {SkeletonObjectType} from '../../SkeletonObjectType';
import Cursor from '../../tools/Cursor';
import {NodeRenderFilter} from '../NodesRenderSystem';
import imgEffectorMask from './ik-chain-effector-mask.png';
import imgMoveMask from './ik-chain-move-mask.png';

const pos = vec3.create();
const vecType = new Float32Array(4);
const vecId = new Float32Array(4);

export default class IkChainPickingRenderFilter extends NodeRenderFilter {

    prioritizeSelectedNode = false;
    private texMoveMask?: Texture;
    private texEffectorMask?: Texture;

    begin(engine: SkeletonEngine): boolean {
        if (engine.tool !== Cursor.name) {
            return false;
        }
        const renderer = engine.renderer;
        renderer.useShader(engine.picking2dShader);
        renderer.depthTest(false);
        renderer.depthMask(false);
        renderer.begin2D();
        if (!this.texMoveMask) {
            this.texMoveMask = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgMoveMask).then(texture => this.texMoveMask = texture);
        }
        if (!this.texEffectorMask) {
            this.texEffectorMask = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgEffectorMask).then(texture => this.texEffectorMask = texture);
        }
        return true;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        if (node.type !== IkChain.name) {
            return;
        }
        if (!this.texMoveMask || !this.texEffectorMask) {
            return;
        }

        const renderer = engine.renderer;
        const matrix = node.getWorldMatrix();

        setBufferVec4FromNum(vecId, 0, node.id);
        renderer.uniform('u_id', vecId);

        if (node.getValue(TranslationHandler)) {
            setBufferVec4FromNum(vecType, 0, SkeletonObjectType.IK_CHAIN_TRANSLATION);
            renderer.uniform('u_type', vecType);
            mat4.getTranslation(pos, matrix);
            vec3.transformMat4(pos, pos, engine.camera.pvMatrix);
            renderer.draw(
                this.texMoveMask,
                pos[0] * renderer.state.width / 2 - this.texMoveMask.width / 2,
                pos[1] * renderer.state.height / 2 - this.texMoveMask.height / 2,
            );
        }

        if (node.getValue(MiddleEffectorHandler) || node === engine.selectedNode) {
            setBufferVec4FromNum(vecType, 0, SkeletonObjectType.IK_CHAIN_MIDDLE_EFFECTOR);
            renderer.uniform('u_type', vecType);
            if (node.getValue(UseWorldSpace)) {
                vec3.copy(pos, node.getValue(MiddleEffector));
            } else {
                vec3.transformMat4(pos, node.getValue(MiddleEffector), matrix);
            }
            vec3.transformMat4(pos, pos, engine.camera.pvMatrix);
            renderer.draw(
                this.texEffectorMask,
                pos[0] * renderer.state.width / 2 - this.texEffectorMask.width / 2,
                pos[1] * renderer.state.height / 2 - this.texEffectorMask.height / 2,
            );
        }

        if (node.getValue(EndEffectorHandler) || node === engine.selectedNode) {
            setBufferVec4FromNum(vecType, 0, SkeletonObjectType.IK_CHAIN_END_EFFECTOR);
            renderer.uniform('u_type', vecType);
            if (node.getValue(UseWorldSpace)) {
                vec3.copy(pos, node.getValue(EndEffector));
            } else {
                vec3.transformMat4(pos, node.getValue(EndEffector), matrix);
            }
            vec3.transformMat4(pos, pos, engine.camera.pvMatrix);
            renderer.draw(
                this.texEffectorMask,
                pos[0] * renderer.state.width / 2 - this.texEffectorMask.width / 2,
                pos[1] * renderer.state.height / 2 - this.texEffectorMask.height / 2,
            );
        }
    }

    end(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.end2D();
        renderer.depthTest(true);
        renderer.depthMask(true);
    }

}