"use strict";
/*
 * 2021/03/02- (c) yoya@awm.jp
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
	    drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndShowa(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawShowa(srcCanvas, dstCanvas);
}
function colortrans_showa(r, g, b) {
    return [
        0.8 * r + 0.1 * g + 0.2 * b,
        0.0 * r + 0.8 * g + 0.2 * b,
        0.1 * r + 0.2 * g + 0.6 * b
    ];
}
    
function contrast_showa(x) {
    if (Array.isArray(x)) {
        let arr = []
        for (let i = 0, n = x.length ; i < n; i++) {
            arr.push(contrast_showa(x[i]))
        }
        return arr;
    }
    return (2*x +1)/4 - Math.tan(1.1 - 2*x)/8;
}


function drawShowa(srcCanvas, dstCanvas) {
    console.debug("drawShowa");
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
	    var [r,g,b,a] = getRGBA(srcImageData, srcX, srcY);
            r /= 255 ;  g /= 255 ; b /= 255;
            [r, g, b] = colortrans_showa(r, g, b)
            [r, g, b] = contrast_showa([r, g, b])
            r *= 255 ; g *= 255 ; b *= 255;
	    setRGBA(dstImageData, dstX, dstY, [r,g,b,a]);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
