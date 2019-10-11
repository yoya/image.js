'use strict';
/*
* 2016/11/13- yoya@awm.jp . All Rights Reserved.
*/

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'filterType':null,
		  'scaleRange':'scaleText',
		  'cubicBRange':'cubicBText',
		  'cubicCRange':'cubicCText',
		  'lobeRange':'lobeText'
},
		 function(target, rel) {
		     drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, rel);
		 });
    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, false);
}

const worker = new workerProcess('worker/rescale.js');

function drawSrcImageAndRescale(srcImage, srcCanvas, dstCancas, sync) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    const params = {
	filterType: document.getElementById('filterType').value,
	scale: parseFloat(document.getElementById('scaleRange').value),
	cubicB:parseFloat(document.getElementById('cubicBRange').value),
	cubicC:parseFloat(document.getElementById('cubicCRange').value),
	lobe:  parseFloat(document.getElementById('lobeRange').value)
    };
    drawFilterGraph(params);
    worker.process(srcCanvas, dstCanvas, params, sync);
}

function drawFilterGraph(params) {
    const graphCanvas = document.getElementById('graphCanvas');
    const x_min = -4.2; const x_max = 4.2;
    const y_min = -1.2; const y_max = 1.2;
    const filterType = params.filterType;
    switch (filterType) {
	case 'NN':
	var color = '#f00';
	var points = [x_min, 0, -0.5, 0, -0.5, 1, 0.5, 1, 0.5, 0, x_max, 0];
	break;
	//
	case 'BiLinear':
	var color = '#08f';
	var points = [x_min, 0, -1, 0, 0, 1, 1, 0, x_max, 0];
	break;
	//
	case 'BiCubic':
	var b = params.cubicB;
	var c = params.cubicC;
	var coeff = cubicBCcoefficient(b, c);
	var points = [];
	var color = '#0b0';
	for (var x = x_min; x <= x_max; x += 0.05) {
	    var y = cubicBC(x, coeff);
	    points.push(x, y);
	}
	break;
	//
	case 'Lanczos':
	var lobe = params.lobe;
	var points = [];
	var color = '#fa0';
	for (var x = x_min; x <= x_max; x += 0.05) {
	    var y = lanczos(x, lobe);
	    points.push(x, y);
	}
	break;
    }
    const graph = {
	canvas:graphCanvas,
	lineColor:color,
	lineWidth:2,
	x_range:[x_min, x_max],
	y_range:[y_min, y_max]
    };
    drawGraph(graph, points);
}
