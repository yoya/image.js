"use strict";
/*
 * 2017/06/16- (c) yoya@awm.jp
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
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var radius = Math.sqrt(srcWidth*srcWidth + srcHeight*srcHeight) / 2;
    
    var dstWidth  = Math.ceil(radius*2);
    var dstHeight = dstWidth;
    dstCanvas.style.backgroundColor = "white";
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    /*
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    setRGBA(dstImageData, dstX, dstY, [255, 255, 255, 0]);
	}
    }
    setRGBA(dstImageData, dstWidth - 1, dstHeight - 1, [255, 255, 255, 1]);
    dstCtx.putImageData(dstImageData, 0, 0);
    */
    var x1 = radius - srcWidth/2;
    var y1 = radius - srcHeight/2;
    var x2 = dstWidth  - 2 * x1;
    var y2 = dstHeight - 2 * y1;
    console.log(Math.ceil(x1), Math.ceil(y1),Math.floor(x2),Math.floor(y2) );
    dstCtx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height,
		     x1, y1, x2, y2);
}
