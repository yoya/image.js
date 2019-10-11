'use strict';
/*
 * 2019/04/08- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const graphCanvas = document.getElementById('graphCanvas');
    bindFunction({
'w1Range':'w1Text',
                  'w2Range':'w2Text',
                  'thetaRange':'thetaText'
},
		 function() {
                     drawPerceptron(graphCanvas);
		 });
    drawPerceptron(graphCanvas);
}

function drawPerceptron(graphCanvas) {
    // console.debug("drawCopy");
    const w1 = parseFloat(document.getElementById('w1Range').value);
    const w2 = parseFloat(document.getElementById('w2Range').value);
    const theta = parseFloat(document.getElementById('thetaRange').value);
    const [x_min, x_max] = [-2, 3];
    const [y_min, y_max] = [-2, 3];
    const graph = {
        canvas:graphCanvas,
        lineColor:'white',
        lineWidth:1,
        x_range:[x_min, x_max],
y_range:[y_min, y_max],
        drawType: 'points'
    };
    graphCanvas.style.backgroundColor = 'gray';
    graphCanvas.width = graphCanvas.width;
    graph.rgbaColor = [255, 0, 0, 255];
    let points = [];
    for (let x = x_min; x <= x_max; x += 0.02) {
        for (let y = y_min; y <= y_max; y += 0.02) {
            const v = x * w1 + y * w2;
            const rgbaColor = value2rgba(v);
            const point = [x, y, rgbaColor];
            points.push(point);
        }
    }
    drawGraph(graph, points);
    //
    points = [x_min,
              (theta - w1 * x_min) / w2,
              x_max,
              (theta - w1 * x_max) / w2];
    drawGraphLines(graph, points);
}

function value2rgba(v) {
    if (v > 0) {
        if (v < 1) { // transparent => red
            var rgbaColor = [255, 0, 0, v * 255];
        }  else {  // red => yellow
            var v2 = v - 1;
            var rgbaColor = [255, v2 * 255, 0, 255];
        }
    } else {
        if (v > -1) { // transparent => cyan
            var rgbaColor = [0, 255, 255, -v * 255];
        } else { // cyan => blue
            var v2 = v + 1;
            var rgbaColor = [0, 255 * (1 + v2), 255, -v * 255];
        }
    }
    return rgbaColor;
}
