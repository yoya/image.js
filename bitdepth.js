"use strict";
/*
 * 2018/10/16- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var graphCanvas = document.getElementById("graphCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCanvas, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "srcBitDepthRange":"srcBitDepthText",
		  "dstBitDepthRange":"dstBitDepthText",
		  "quantizeSelect":null,
		  "ditherSelect":null},
		 function(target, rel) {
		     drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCanvas, rel);
		 } );
    drawBitDepthGraph(srcCanvas, dstCanvas, graphCanvas);
}

function drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCancas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcBitDepth = parseFloat(document.getElementById("srcBitDepthRange").value);
    var dstBitDepth = parseFloat(document.getElementById("dstBitDepthRange").value);
    var dither = document.getElementById("ditherSelect").value;
    var quantize = document.getElementById("quantizeSelect").value;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var params = {
	"srcBitDepth":srcBitDepth,
	"dstBitDepth":dstBitDepth,
	"dither":dither,
	"quantize":quantize
    };
    drawBitDepth(srcCanvas, dstCanvas, params, sync);
}


var worker = new workerProcess("worker/bitdepth.js");

function drawBitDepth(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
    worker.addListener(drawBitDepthGraph);
}

function drawBitDepthGraph(dstImageData) {
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var graphCanvas = document.getElementById("graphCanvas");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var graphCtx = graphCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var dstImageData = dstCtx.getImageData(0, 0, width, height);
    var pointsR = [], pointsG = [], pointsB = [];
    for (var y = 0 ; y < height ; y++) {
	for (var x = 0 ; x < width ; x++) {
	    var [srcR, srcG, srcB] = getRGBA(srcImageData, x, y);
	    var [dstR, dstG, dstB] = getRGBA(dstImageData, x, y);
	    pointsR.push(srcR, srcR, srcR, dstR);
	    pointsG.push(srcG, srcG, srcG, dstG);
	    pointsB.push(srcB, srcB, srcB, dstB);
	}
    }
    var graph ={
	canvas:graphCanvas,
	lineColor:"",
	lineWidth:1,
	x_range:[0, 255],
	y_range:[0, 255],
	lineType:"lines"
    };

    drawGraphBase(graph);

    graph.lineColor="#F00"; // red
    drawGraphLines(graph, pointsR);
    graph.lineColor="#0F0"; // green
    drawGraphLines(graph, pointsG);
    graph.lineColor= "#00F"; // blue
    drawGraphLines(graph, pointsB);
}
