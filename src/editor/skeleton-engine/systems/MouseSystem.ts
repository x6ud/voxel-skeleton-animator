import {vec3} from 'gl-matrix';
import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';

export default class MouseSystem extends UpdateSystem<SkeletonEngine> {

    begin(engine: SkeletonEngine): void {
        const mouse = engine.mouseNormalized;
        const input = engine.input;
        const renderer = engine.renderer;
        mouse[0] = (+input.mouseX / renderer.state.width - 0.5) * 2;
        mouse[1] = (-input.mouseY / renderer.state.height + 0.5) * 2;

        const camera = engine.camera;
        mouse[2] = -1;
        camera.screenToView(engine.mouseRay0, mouse);
        mouse[2] = 1;
        camera.screenToView(engine.mouseRay1, mouse);
        const normal = engine.mouseNormal;
        vec3.sub(normal, engine.mouseRay1, engine.mouseRay0);
        vec3.normalize(normal, normal);
    }

    end(engine: SkeletonEngine): void {
    }

}
