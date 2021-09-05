"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
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
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawCopy(srcCanvas, dstCanvas);
}

function drawCopy(srcCanvas, dstCanvas) {
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var dstImageData = dstCtx.createImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = getRGBA(srcImageData, x, y);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

function drawCopy2(srcCanvas, dstCanvas) {
    // console.debug("drawCopy");
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
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
