"use strict";
/*
 * 2017/03/17- (c) yoya@awm.jp
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
	    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawQuantize(srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction("range2text", {"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawQuantize(srcCanvas, dstCanvas);
		 } );
}

function drawQuantize(srcCanvas, dstCanvas) {
    // console.debug("drawQuantize");
    //
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = srcWidth, dstHeight = srcHeight;
    dstCanvas.width = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    for (var srcY = 0 ; srcY < srcHeight; srcY++) {
        for (var srcX = 0 ; srcX < srcWidth; srcX++) {
	    var dstX = srcX, dstY = srcY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    rgba[0] &= 0xe0; // 1110 0000
	    rgba[1] &= 0xe0; // 1110 0000
	    rgba[2] &= 0xc0; // 1100 0000
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
