"use strict";
/*
 * 2019/04/12- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var graphCanvas = document.getElementById("graphCanvas");
    var params = {};
    bindParams(params, function(key, target, rel) {
                     drawExponential(graphCanvas, params);
		 }, {keys: ["a", "exp", "expdiff", "explog"]});
    drawExponential(graphCanvas, params);
}

function drawExponential(graphCanvas, params) {
    // console.debug("drawCopy");
    var { a, exp, expdiff, explog } = params;
    var [x_min, x_max] = [-2, 3];
    var [y_min, y_max] = [-2, 3];
    var graph ={
        canvas:graphCanvas,
        lineColor:"red",
        lineWidth:1,
        x_range:[x_min, x_max], y_range:[y_min, y_max],
        drawType: "lines"
    };
    graphCanvas.style.backgroundColor = "white";
    graphCanvas.width = graphCanvas.width;
    drawGraphBase(graph, points);
    var points;
    
    if (exp) {
        points = [];
        for (var x = x_min ; x <= x_max; x += 0.02) {
            var y = Math.pow(a, x);
            points.push(x, y);
        }
        graph.lineColor = "red";
        drawGraphLines(graph, points);
    }
    if (expdiff) {
        points = [];
        var h = 0.00001;
        for (var x = x_min ; x <= x_max; x += 0.02) {
            var y = (Math.pow(a, x+h) - Math.pow(a, x) ) / h;
            points.push(x, y);
        }
        graph.lineColor = "green";
        drawGraphLines(graph, points)
    }
    if (explog) {
        points = [];
        for (var x = x_min ; x <= x_max; x += 0.02) {
            var y = Math.pow(a, x) * Math.log(a);
            points.push(x, y);
        }
        graph.lineColor = "blue";
        drawGraphLines(graph, points);
    }
}
