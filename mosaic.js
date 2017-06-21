"use strict";
/*
 * 2017/06/22- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var block = parseFloat(document.getElementById("blockRange").value);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawMosaic(srcCanvas, dstCanvas, block);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMosaic(srcCanvas, dstCanvas, block);
		 } );
    bindFunction({"blockRange":"blockText"},
		 function() {
		     block = parseFloat(document.getElementById("blockRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMosaic(srcCanvas, dstCanvas, block);
		 } );
}

function drawMosaic(srcCanvas, dstCanvas, block) {
    // console.debug("drawMosaic");
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
    for (var dstY = 0 ; dstY < dstHeight; dstY+=block) {
        for (var dstX = 0 ; dstX < dstWidth; dstX+=block) {
	    var w = (dstX+block<dstWidth)?block:(dstWidth-dstX);
	    var h = (dstY+block<dstHeight)?block:(dstHeight-dstY);
	    var [r2, g2, b2, a2] = [0, 0, 0, 0];
	    for (var y = 0 ; y < h ; y++) {
		for (var x = 0 ; x < w ; x++) {
		    var srcX = dstX + x
		    var srcY = dstY + y;
		    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
		    r2 += r;  g2 += g;  b2 += b; a2 += a;
		}
	    }
	    var w_h = w*h;
	    r2 /= w_h; g2 /= w_h; b2 /= w_h; a2 /= w_h;
	    for (var y = 0 ; y < h ; y++) {
		for (var x = 0 ; x < w ; x++) {
		    setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		}
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
