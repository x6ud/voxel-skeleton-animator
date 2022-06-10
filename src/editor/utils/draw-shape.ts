import Renderer from '../../common/render/Renderer';

export function drawCross(renderer: Renderer, x: number, y: number, radius: number) {
    renderer.drawLine(
        x - radius,
        y,
        x + radius,
        y
    );
    renderer.drawLine(
        x,
        y - radius,
        x,
        y + radius
    );
}

export function drawCrossS(renderer: Renderer, x: number, y: number, radius: number) {
    renderer.drawLine(x - radius, y - radius, x + radius, y + radius);
    renderer.drawLine(x - radius, y + radius, x + radius, y - radius);
}

export function drawRect(renderer: Renderer, x0: number, y0: number, x1: number, y1: number) {
    renderer.drawLine(x0, y0, x1, y0);
    renderer.drawLine(x0, y1, x1, y1);
    renderer.drawLine(x0, y0, x0, y1);
    renderer.drawLine(x1, y0, x1, y1);
}

export function drawCircle(
    renderer: Renderer,
    cx: number,
    cy: number,
    radius: number,
    precision: number = Math.min(8, radius / 2)
) {
    let x0 = 0;
    let y0 = radius;
    const num = Math.ceil(2 * Math.PI * radius / (precision / renderer.state.zoom));
    const detAngle = Math.PI * 2 / num;
    const cos = Math.cos(detAngle);
    const sin = Math.sin(detAngle);
    const px = cx;
    const py = cy;
    for (let i = 0; i < num; ++i) {
        const x1 = x0 * cos - y0 * sin;
        const y1 = x0 * sin + y0 * cos;
        renderer.drawLine(
            x0 + px,
            y0 + py,
            x1 + px,
            y1 + py
        );
        x0 = x1;
        y0 = y1;
    }
}

export function drawArc(
    renderer: Renderer,
    cx: number,
    cy: number,
    radius: number,
    angleStart: number = 0,
    angleEnd: number = Math.PI * 2,
    precision: number = Math.min(8, radius / 2)
) {
    let cos = Math.cos(angleStart);
    let sin = Math.sin(angleStart);
    let x0 = radius * cos;
    let y0 = radius * sin;
    const num = Math.ceil(Math.abs(angleEnd - angleStart) * radius / (precision / renderer.state.zoom));
    const detAngle = (angleEnd - angleStart) / num;
    cos = Math.cos(detAngle);
    sin = Math.sin(detAngle);
    const px = cx;
    const py = cy;
    for (let i = 0; i < num; ++i) {
        const x1 = x0 * cos - y0 * sin;
        const y1 = x0 * sin + y0 * cos;
        renderer.drawLine(
            x0 + px,
            y0 + py,
            x1 + px,
            y1 + py
        );
        x0 = x1;
        y0 = y1;
    }
}

export function drawLineWithAngle(
    renderer: Renderer,
    x0: number,
    y0: number,
    radius: number,
    angle: number
) {
    renderer.drawLine(
        x0,
        y0,
        Math.cos(angle) * radius + x0,
        Math.sin(angle) * radius + y0
    );
}
