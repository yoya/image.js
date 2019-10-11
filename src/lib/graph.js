export function cssColor(r, g, b) {
    return `rgb(${r},${g},${b})`;
}

export function scaleMap(graph, x, y, width, height) {
    const [x_min, x_max] = graph.x_range;
    const [y_min, y_max] = graph.y_range;
    const x = ((x - x_min) / (x_max - x_min)) * width;
    const y = ((y_max - y) / (y_max - y_min)) * height;
    return [x, y];
}

export function drawLine(graph, ctx, x1, y1, x2, y2, color, lineWidth, width, height) {
    const x_range = graph.x_range;
    const y_range = graph.y_range;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    const [x1, y1] = scaleMap(graph, x1, y1, width, height);
    const [x2, y2] = scaleMap(graph, x2, y2, width, height);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

export function drawLines(graph, ctx, points, width, height) {
    const lineColor = graph.lineColor;
    const lineWidth = graph.lineWidth;
    const x_range = graph.x_range;
    const y_range = graph.y_range;
    const lineType = graph.lineType ? graph.lineType : 'line';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    if (lineType === 'line') {
        let [x, y] = points.slice(0, 2);
        [x, y] = scaleMap(graph, x, y, width, height);
        ctx.moveTo(x, y);

        for (let i = 2; i < points.length; i += 2) {
            [x, y] = points.slice(i, i + 2);
            [x, y] = scaleMap(graph, x, y, width, height);
            ctx.lineTo(x, y);
        }
    } else if (lineType === 'lines') {
        for (let i = 0; i < points.length; i += 4) {
            let [x1, y1, x2, y2] = points.slice(i, i + 4);
            [x1, y1] = scaleMap(graph, x1, y1, width, height);
            [x2, y2] = scaleMap(graph, x2, y2, width, height);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
    }

    ctx.stroke();
    ctx.restore();
}

export function drawGraph(graph, points) {
    // clear
    graph.canvas.width = graph.canvas.width;

    if (graph.drawType === 'points') {
        drawGraphPoints(graph, points);
    } else {
        drawGraphLines(graph, points);
    }

    drawGraphBase(graph);
}

export function drawGraphAxisDelta(range, size) { // size = width or height
    let delta = 1;
    const [min, max] = range;
    const scale = size / (max - min);

    if (scale > 100) {
        if (scale > 200) {
            delta *= 0.1;
        } else {
            delta *= 0.5;
        }
    } else if (scale < 5) {
        if (scale < 1) {
            delta *= 100;
        } else if (scale < 2) {
            delta *= 50;
        } else {
            delta *= 10;
        }
    }

    return delta;
}

export function drawGraphBase(graph) {
    const canvas = graph.canvas;
    const x_range = graph.x_range;
    const y_range = graph.y_range;
    const [x_min, x_max] = x_range;
    const [y_min, y_max] = y_range;
    const ctx = canvas.getContext('2d');
    const width = canvas.width; const height = canvas.height;

    // axis
    drawLine(graph, ctx, x_min, 0, x_max, 0, 'black', 3, width, height);
    drawLine(graph, ctx, 0, y_min, 0, y_max, 'black', 3, width, height);
    ctx.font = '14px \'gothic\'';
    ctx.fillStyle = '#808';
    const dx = drawGraphAxisDelta(x_range, width);
    const dy = drawGraphAxisDelta(y_range, height);
    let x = 0;
    let y = 0;

    for (; x > Math.ceil(x_min); x -= dx);

    for (; y > Math.ceil(y_min); y -= dy);

    for (; x <= Math.floor(x_max); x += dx) {
        drawLine(graph, ctx, x, y_min, x, y_max, 'black', 0.5, width, height);
        const [xx, yy] = scaleMap(graph, x, 0, width, height);
        ctx.fillText('' + x, xx + 3, yy - 3);
    }

    for (; y <= Math.floor(y_max); y += dy) {
        drawLine(graph, ctx, x_min, y, x_max, y, 'black', 0.5, width, height);
        const [xx, yy] = scaleMap(graph, 0, y, width, height);

        if (y !== 0) {
            ctx.fillText('' + y, xx + 3, yy - 3);
        }
    }
}

export function drawGraphLines(graph, points) {
    const canvas = graph.canvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    drawLines(graph, ctx, points, width, height);
}

export function drawGraphPoints(graph, points) {
    const canvas = graph.canvas;
    let rgba = graph.rgbaColor;
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);

    for (let i = 0, n = points.length; i < n; i++) {
        const point = points[i];
        let [x, y] = point;
        [x, y] = scaleMap(graph, x, y, width, height);

        if (points.length > 2) {
            rgba = point[2];
        }

        addRGBA(imageData, Math.round(x), Math.round(y), rgba);
    }

    ctx.putImageData(imageData, 0, 0);
}
