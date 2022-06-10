import CameraDraggingContext from '../../utils/camera/CameraDraggingContext';
import SkeletonEngine from '../SkeletonEngine';
import {SkeletonObjectType} from '../SkeletonObjectType';
import UpdateSystem from '../../utils/UpdateSystem';

export default class CameraDraggingSystem extends UpdateSystem<SkeletonEngine> {

    private readonly cameraDraggingContext = new CameraDraggingContext();

    begin(engine: SkeletonEngine): void {
        if (engine.draggingObjectType === SkeletonObjectType.NONE
            && !engine.draggingWithMouseRight
        ) {
            const renderer = engine.renderer;
            this.cameraDraggingContext.update(engine.input, engine.camera, renderer.state.width, renderer.state.height);
        }
    }

    end(engine: SkeletonEngine): void {
    }

}
