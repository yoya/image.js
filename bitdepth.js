"use strict";
/*
 * 2018/10/16- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const graphCanvas = document.getElementById("graphCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight", "srcBitDepth", "dstBitDepth", "quantize", "dither"]});
    drawBitDepthGraph(srcCanvas, dstCanvas, graphCanvas);
}

function drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCanvas, params, sync) {
    const { maxWidthHeight, srcBitDepth, dstBitDepth, dither, quantize } = params;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    const params_w = {
	"srcBitDepth":srcBitDepth,
	"dstBitDepth":dstBitDepth,
	"dither":dither,
	"quantize":quantize
    };
    drawBitDepth(srcCanvas, dstCanvas, params_w, sync);
}


const worker = new workerProcess("worker/bitdepth.js");

function drawBitDepth(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
    worker.addListener(drawBitDepthGraph);
}

function drawBitDepthGraph() {
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const graphCanvas = document.getElementById("graphCanvas");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const graphCtx = graphCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.getImageData(0, 0, width, height);
    const pointsR = [], pointsG = [], pointsB = [];
    for (let y = 0 ; y < height ; y++) {
	for (let x = 0 ; x < width ; x++) {
	    const [srcR, srcG, srcB] = getRGBA(srcImageData, x, y);
	    const [dstR, dstG, dstB] = getRGBA(dstImageData, x, y);
	    pointsR.push(srcR, srcR, srcR, dstR);
	    pointsG.push(srcG, srcG, srcG, dstG);
	    pointsB.push(srcB, srcB, srcB, dstB);
	}
    }
    const graph ={
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
