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
	    drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCanvas);
	    drawBitDepthGraph(srcCanvas, dstCanvas, graphCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "srcBitDepthRange":"srcBitDepthText",
		  "dstBitDepthRange":"dstBitDepthText",
		  "quantizeSelect":null,
		  "ditherSelect":null},
		 function() {
		     drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCanvas);
		     drawBitDepthGraph(srcCanvas, dstCanvas, graphCanvas);
		 } );
    drawBitDepthGraph(srcCanvas, dstCanvas, graphCanvas);
}

function drawSrcImageAndBitDepth(srcImage, srcCanvas, dstCancas) {
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
    drawBitDepth(srcCanvas, dstCanvas, params);
}

var maxValueByBitDepth = {
    0: 1 - 1,
    1: 2 - 1,
    2: 2*2 - 1,
    3: 2*2*2 - 1 ,
    4: 2*2*2*2 - 1,
    5: 2*2*2*2*2 - 1,
    6: 2*2*2*2*2*2 - 1,
    7: 2*2*2*2*2*2*2 - 1,
    8: 2*2*2*2*2*2*2*2 - 1,
};

function quantizeDepth(v, srcBitDepth, dstBitDepth, quantize, dither, srcX, srcY) {
    var ditherSpread = 0;
    switch (dither) {
    case "none":
	ditherSpread = 0;
	break;
    case "random":
	ditherSpread = Math.random() - 0.5;
	break;
    default:
	console.error("wrong dither method:", dither);
    }
    var depthRatio = maxValueByBitDepth[dstBitDepth] / maxValueByBitDepth[srcBitDepth];
    var depthRatio2 = (maxValueByBitDepth[dstBitDepth]+1) / (maxValueByBitDepth[srcBitDepth]+1);
    if (srcBitDepth < dstBitDepth) {
	ditherSpread *= depthRatio;
	v = Math.round(v * depthRatio + ditherSpread);
    } else if (srcBitDepth > dstBitDepth) {
	switch (quantize) {
	case "nn":
	    v = Math.floor(v * depthRatio + ditherSpread + 0.5);
	    break;
	case "equalize":
	    v = Math.floor(v * depthRatio2 + ditherSpread);
	    break;
	case "inverse":
	    v = Math.floor(v * depthRatio + ditherSpread);
	    break;
	default:
	    console.error("wrong quantize method:", quantize);
	}
    }
    return v;
}

function bitDepth(rgba, srcBitDepth, dstBitDepth, quantize, dither, srcX, srcY) {
    return rgba.map(function(v) {
	v = quantizeDepth(v, 8, srcBitDepth, quantize, "none");
	v = quantizeDepth(v, srcBitDepth, dstBitDepth, quantize, dither, srcX, srcY);
	return quantizeDepth(v, dstBitDepth, 8, quantize, "none");
    });
}
    
function drawBitDepth(srcCanvas, dstCanvas, params) {
    // console.debug("drawBitDepth");
    var srcBitDepth = params.srcBitDepth;
    var dstBitDepth = params.dstBitDepth;
    var dither = params.dither;
    var quantize = params.quantize;
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    rgba = bitDepth(rgba, srcBitDepth, dstBitDepth,
			    quantize, dither, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

function drawBitDepthGraph(srcCanvas, dstCanvas, graphCanvas) {
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
	lineWidth:2,
	x_range:[-10, 255+10],
	y_range:[-10, 255+10],
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
