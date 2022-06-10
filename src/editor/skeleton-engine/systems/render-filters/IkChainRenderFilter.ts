import {mat4, vec3} from 'gl-matrix';
import Texture from '../../../../common/render/Texture';
import EndEffector from '../../components/EndEffector';
import EndEffectorHandler from '../../components/EndEffectorHandler';
import MiddleEffector from '../../components/MiddleEffector';
import MiddleEffectorHandler from '../../components/MiddleEffectorHandler';
import TranslationHandler from '../../components/TranslationHandler';
import UseWorldSpace from '../../components/UseWorldSpace';
import IkChain from '../../nodes/IkChain';
import SkeletonEngine from '../../SkeletonEngine';
import SkeletonModelNode from '../../SkeletonModelNode';
import Cursor from '../../tools/Cursor';
import {NodeRenderFilter} from '../NodesRenderSystem';
import imgEffectorHandler2 from './ik-chain-effector-handler-2.png';
import imgEffectorHandler from './ik-chain-effector-handler.png';
import imgMoveHandler from './ik-chain-move-handler.png';

const pos = vec3.create();

export default class IkChainRenderFilter extends NodeRenderFilter {

    prioritizeSelectedNode = false;
    private texMoveHandler?: Texture;
    private texEffectorHandler?: Texture;
    private texEffectorHandler2?: Texture;

    begin(engine: SkeletonEngine): boolean {
        if (engine.tool !== Cursor.name) {
            return false;
        }
        const renderer = engine.renderer;
        renderer.useShader();
        renderer.depthTest(false);
        renderer.depthMask(false);
        renderer.begin2D();
        if (!this.texMoveHandler) {
            this.texMoveHandler = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgMoveHandler).then(texture => this.texMoveHandler = texture);
        }
        if (!this.texEffectorHandler) {
            this.texEffectorHandler = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgEffectorHandler).then(texture => this.texEffectorHandler = texture);
        }
        if (!this.texEffectorHandler2) {
            this.texEffectorHandler2 = renderer.createEmptyTexture(0, 0);
            renderer.createTextureFromImageUrl(imgEffectorHandler2).then(texture => this.texEffectorHandler2 = texture);
        }
        return true;
    }

    render(engine: SkeletonEngine, node: SkeletonModelNode): void {
        if (node.type !== IkChain.name) {
            return;
        }
        if (!this.texMoveHandler || !this.texEffectorHandler || !this.texEffectorHandler2) {
            return;
        }

        const renderer = engine.renderer;
        const matrix = node.getWorldMatrix();

        if (node === engine.selectedNode) {
            renderer.setColor(1, 1, 0, 1);
        } else {
            renderer.setColor(1, 1, 1, 1);
        }

        if (node.getValue(TranslationHandler)) {
            mat4.getTranslation(pos, matrix);
            vec3.transformMat4(pos, pos, engine.camera.pvMatrix);
            renderer.draw(
                this.texMoveHandler,
                pos[0] * renderer.state.width / 2 - this.texMoveHandler.width / 2,
                pos[1] * renderer.state.height / 2 - this.texMoveHandler.height / 2,
            );
        }

        if (node.getValue(MiddleEffectorHandler) || node === engine.selectedNode) {
            if (node.getValue(UseWorldSpace)) {
                vec3.copy(pos, node.getValue(MiddleEffector));
            } else {
                vec3.transformMat4(pos, node.getValue(MiddleEffector), matrix);
            }
            vec3.transformMat4(pos, pos, engine.camera.pvMatrix);
            renderer.draw(
                this.texEffectorHandler2,
                pos[0] * renderer.state.width / 2 - this.texEffectorHandler2.width / 2,
                pos[1] * renderer.state.height / 2 - this.texEffectorHandler2.height / 2,
            );
        }

        if (node.getValue(EndEffectorHandler) || node === engine.selectedNode) {
            if (node.getValue(UseWorldSpace)) {
                vec3.copy(pos, node.getValue(EndEffector));
            } else {
                vec3.transformMat4(pos, node.getValue(EndEffector), matrix);
            }
            vec3.transformMat4(pos, pos, engine.camera.pvMatrix);
            renderer.draw(
                this.texEffectorHandler,
                pos[0] * renderer.state.width / 2 - this.texEffectorHandler.width / 2,
                pos[1] * renderer.state.height / 2 - this.texEffectorHandler.height / 2,
            );
        }
    }

    end(engine: SkeletonEngine): void {
        const renderer = engine.renderer;
        renderer.setColor(1, 1, 1, 1);
        renderer.end2D();
        renderer.depthTest(true);
        renderer.depthMask(true);
    }

}