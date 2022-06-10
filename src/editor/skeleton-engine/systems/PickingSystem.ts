import SkeletonEngine from '../SkeletonEngine';
import Cursor from '../tools/Cursor';
import UpdateSystem from '../../utils/UpdateSystem';

const vecRgba = new Uint8Array(4);

export default class PickingSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const gl = engine.renderer.gl;
        const input = engine.input;
        const mx = input.mouseX;
        const my = engine.renderer.state.height - input.mouseY;

        gl.bindFramebuffer(gl.FRAMEBUFFER, engine.objectTypeFrameBuffer.glFrameBuffer!);
        gl.readPixels(mx, my, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, vecRgba);
        const type = vecRgba[0] + (vecRgba[1] << 8) + (vecRgba[2] << 16) + ((vecRgba[3] << 24) >>> 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, engine.objectIdFrameBuffer.glFrameBuffer!);
        gl.readPixels(mx, my, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, vecRgba);
        const id = vecRgba[0] + (vecRgba[1] << 8) + (vecRgba[2] << 16) + ((vecRgba[3] << 24) >>> 0);

        engine.hoveredObjectType = type;
        engine.hoveredObjectId = id;
        if (input.mouseLeftDownThisFrame) {
            engine.draggingObjectType = type;
            engine.draggingObjectId = id;
            if (engine.tool === Cursor.name) {
                if (type && id) {
                    engine.onSelectNode(id);
                } else if (!type) {
                    engine.onSelectNode(0);
                }
            }
        }
        if (!input.mouseLeft || input.mouseRightDownThisFrame) {
            engine.draggingObjectType = 0;
            engine.draggingObjectId = 0;
        }
        if (!input.mouseRight) {
            engine.draggingWithMouseRight = false;
        }
    }

    end(engine: SkeletonEngine): void {
    }

}
