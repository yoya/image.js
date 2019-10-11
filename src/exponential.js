'use strict';
/*
 * 2019/04/12- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const graphCanvas = document.getElementById('graphCanvas');
    bindFunction({
 'aRange':'aText',
                  'expCheckbox':null,
                  'expdiffCheckbox':null,
                  'explogCheckbox':null
},
		 function() {
                     drawExponential(graphCanvas);
		 });
    drawExponential(graphCanvas);
}

function drawExponential(graphCanvas) {
    // console.debug("drawCopy");
    const a = parseFloat(document.getElementById('aRange').value);
    const expCheckbox = document.getElementById('expCheckbox');
    const expdiffCheckbox = document.getElementById('expdiffCheckbox');
    const explogCheckbox = document.getElementById('explogCheckbox');
    const [x_min, x_max] = [-2, 3];
    const [y_min, y_max] = [-2, 3];
    const graph = {
        canvas:graphCanvas,
        lineColor:'red',
        lineWidth:1,
        x_range:[x_min, x_max],
y_range:[y_min, y_max],
        drawType: 'lines'
    };
    graphCanvas.style.backgroundColor = 'white';
    graphCanvas.width = graphCanvas.width;
    drawGraphBase(graph, points);
    let points;

    if (expCheckbox.checked) {
        points = [];
        for (var x = x_min; x <= x_max; x += 0.02) {
            var y = Math.pow(a, x);
            points.push(x, y);
        }
        graph.lineColor = 'red';
        drawGraphLines(graph, points);
    }
    if (expdiffCheckbox.checked) {
        points = [];
        const h = 0.00001;
        for (var x = x_min; x <= x_max; x += 0.02) {
            var y = (Math.pow(a, x + h) - Math.pow(a, x)) / h;
            points.push(x, y);
        }
        graph.lineColor = 'green';
        drawGraphLines(graph, points);
    }
    if (explogCheckbox.checked) {
        points = [];
        for (var x = x_min; x <= x_max; x += 0.02) {
            var y = Math.pow(a, x) * Math.log(a);
            points.push(x, y);
        }
        graph.lineColor = 'blue';
        drawGraphLines(graph, points);
    }
}
