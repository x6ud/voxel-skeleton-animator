import {vec3} from 'gl-matrix';
import Input from '../Input';
import {MouseDragContext3D, raycastViewPlaneDragMove, raycastViewPlaneDragStart} from '../mouse-drag';
import WrappedCamera from './WrappedCamera';

const CAMERA_ZOOM_MIN = -12;
const CAMERA_ZOOM_MAX = 48;

export default class CameraDraggingContext {

    rotateEnabled = true;
    dragEnabled = true;
    zoomEnabled = true;

    private draggingRotation: boolean = false;
    private draggingPosition: boolean = false;
    private dragStartProjectedMouseX: number = 0;
    private dragStartProjectedMouseY: number = 0;
    private dragStartRotateX = 0;
    private dragStartRotateY = 0;
    private positionDragContext = new MouseDragContext3D();

    update(input: Input, camera: WrappedCamera, viewWidth: number, viewHeight: number) {
        const projectedMouseX = (-viewWidth / 2 + input.mouseX) / viewWidth * 2;
        const projectedMouseY = (+viewHeight / 2 - input.mouseY) / viewHeight * 2;

        // rotation
        if (this.rotateEnabled) {
            if (input.mouseMiddle || (input.isKeyPressed('Control') && input.mouseRight)) {
                if (this.draggingRotation) {
                    const dx = projectedMouseX - this.dragStartProjectedMouseX;
                    const dy = projectedMouseY - this.dragStartProjectedMouseY;
                    camera.rotateXDeg = Math.max(-90, Math.min(90, this.dragStartRotateX + dy * 90));
                    camera.rotateYDeg = (this.dragStartRotateY - dx * 90) % 360;
                } else {
                    this.draggingRotation = true;
                    this.dragStartProjectedMouseX = projectedMouseX;
                    this.dragStartProjectedMouseY = projectedMouseY;
                    this.dragStartRotateX = camera.rotateXDeg;
                    this.dragStartRotateY = camera.rotateYDeg;
                }
            } else {
                this.draggingRotation = false;
            }
        }

        // position
        if (this.dragEnabled) {
            if (input.mouseRight && !input.isKeyPressed('Control')) {
                if (this.draggingPosition) {
                    if (raycastViewPlaneDragMove(
                        this.positionDragContext,
                        projectedMouseX, projectedMouseY,
                        camera.camera
                    )) {
                        vec3.sub(camera.target, this.positionDragContext.dragStartTargetPosition, this.positionDragContext.offset);
                    }
                } else if (!this.draggingRotation) {
                    this.draggingPosition = true;
                    raycastViewPlaneDragStart(
                        this.positionDragContext,
                        projectedMouseX, projectedMouseY,
                        camera.target[0], camera.target[1], camera.target[2],
                        camera.camera
                    );
                }
            } else {
                this.draggingPosition = false;
            }
        }

        // zoom
        if (this.zoomEnabled && input.wheelDetY) {
            camera.zoom = Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, camera.zoom + input.wheelDetY));
        }
    }

}
