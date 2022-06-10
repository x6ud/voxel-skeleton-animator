import CameraDraggingContext from '../../utils/camera/CameraDraggingContext';
import SkeletonEngine from '../SkeletonEngine';
import UpdateSystem from '../../utils/UpdateSystem';

export default class PreviewCameraDraggingSystem extends UpdateSystem<SkeletonEngine> {

    private readonly cameraDraggingContext = new CameraDraggingContext();

    constructor() {
        super();
        this.cameraDraggingContext.rotateEnabled = false;
        this.cameraDraggingContext.zoomEnabled = false;
    }

    begin(engine: SkeletonEngine): void {
        if (engine.previewCanvas) {
            this.cameraDraggingContext.update(
                engine.previewInput,
                engine.previewCamera,
                engine.renderer.state.width * engine.previewCameraZoom,
                engine.renderer.state.height * engine.previewCameraZoom,
            );
        }
    }

    end(engine: SkeletonEngine): void {
    }

}
