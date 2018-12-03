"use strict";
/*
 * 2018/12/03- (c) yoya@awm.jp
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

var LBPorder = [0, 1, 2, 5, 8, 7, 6, 3]; // clock-wise order
    
function LBPbuild(arr) {
    var center = arr[4];
    var v = 0;
    for (var i = 0 ; i < 8 ; i++) {
	v <<= 1;
	v += (center < arr[LBPorder[i]])? 0 : 1
    }
    return v;
}

function LBP(srcImageData, srcX, srcY) {
    var rArr = [], gArr = [], bArr = [];
    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    for (var y = -1 ; y <= 1 ; y++) {
	for (var x = -1 ; x <= 1 ; x++) {
	    [r, g, b] = getRGBA(srcImageData, srcX + x, srcY + y);
	    rArr.push(r);
	    gArr.push(g);
	    bArr.push(b)
	}
    }
    return [LBPbuild(rArr), LBPbuild(gArr), LBPbuild(bArr), a];
}


function drawCopy(srcCanvas, dstCanvas) {
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
	    var rgba = LBP(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
