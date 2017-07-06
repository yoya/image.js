"use strict";
/*
 * 2017/06/13- (c) yoya@awm.jp
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
	    drawSrcImageAndVinette(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "linearGammaCheckbox":null},
		 function() {
		     drawSrcImageAndVinette(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndVinette(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var linearGamma = document.getElementById("linearGammaCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawVinette(srcCanvas, dstCanvas, linearGamma);
}


function drawVinette(srcCanvas, dstCanvas, linearGamma) {
    // console.debug("drawVinette");
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
	    var longSide = Math.max(width, height);
            var dx = (x - (width  / 2)) / (longSide / 2);
            var dy = (y - (height / 2)) / (longSide / 2);
            var r = Math.sqrt(dx*dx + dy*dy);
	    var factor = Math.pow(Math.cos(r/2.0), 4);
	    if (linearGamma) {
		var rgba = getRGBA(srcImageData, x, y);
		var [lr, lg, lb, la] = sRGB2linearRGB(rgba);
		lr *= factor;
		lg *= factor;
		lb *= factor;
		[r, g, b, a] = linearRGB2sRGB([lr, lg, lb, la]);
	    } else {
		var [r, g, b, a] = getRGBA(srcImageData, x, y);
		r *= factor;
		g *= factor;
		b *= factor;
	    }
	    setRGBA(dstImageData, x, y, [r, g, b, a]);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
