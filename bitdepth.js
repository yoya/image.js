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
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "srcBitDepthRange":"srcBitDepthText",
		  "dstBitDepthRange":"dstBitDepthText"},
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcBitDepth = parseFloat(document.getElementById("srcBitDepthRange").value);
    var dstBitDepth = parseFloat(document.getElementById("dstBitDepthRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var params = {
	"srcBitDepth":srcBitDepth,
	"dstBitDepth":dstBitDepth
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

function quantizeDepth(v, srcBitDepth, dstBitDepth) {
    return Math.round(v * maxValueByBitDepth[dstBitDepth] / maxValueByBitDepth[srcBitDepth]);
}

function bitDepth(rgba, srcBitDepth, dstBitDepth) {
    return rgba.map(function(v) {
	v = quantizeDepth(v, srcBitDepth, dstBitDepth);
	return quantizeDepth(v, dstBitDepth, 8);
    });
}
    
function drawBitDepth(srcCanvas, dstCanvas, params) {
    // console.debug("drawBitDepth");
    var srcBitDepth = params.srcBitDepth;
    var dstBitDepth = params.dstBitDepth;
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
	    rgba = bitDepth(rgba, srcBitDepth, dstBitDepth);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}