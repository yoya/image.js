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

// ref) https://trac.ffmpeg.org/attachment/wiki/RemapFilter/projection.c
function fisheyeTransform(dstX, dstY, dstImageData, srcImageData) {
    var [dstWidth, dstHeight] = [dstImageData.width, dstImageData.height];
    var [srcWidth, srcHeight] = [srcImageData.width, srcImageData.height];
    if (false) {
	var theta2 = Math.atan2(dstY/dstHeight - 0.5, dstX/dstWidth - 0.5);
	if (theta2 === 0) {
	    console.log("XXXXXX");
	}
	var phi2_over_pi = (dstX/dstWidth - 0.5) / Math.cos(theta2);
	var y =  Math.cos(phi2_over_pi * Math.PI);
	var z = - Math.sin(theta2); // XXX
	var x =   Math.cos(theta2); // XXX
	var a = Math.sqrt((1 - y*y) / (x*x + z*z)); // x^2+y^2+z^2 = 1.0
	z = a * z;
	x = a * x;
	// console.log(x, y, z);
	var phi = Math.acos(z);
	var theta = Math.acos(x / Math.sin(phi));
	var srcY  = phi / Math.PI * srcHeight;
	var srcX =  (1.0 - theta / Math.PI) * srcWidth;
    } else {
	var theta = (1.0 - dstX / dstWidth) * Math.PI;
	var phi = (dstY / dstHeight) * Math.PI;
	var x = Math.cos(theta) * Math.sin(phi);
	var y = Math.sin(theta) * Math.sin(phi);
	var z = Math.cos(phi);
	// console.log(x,y,z);
	var theta2 = Math.atan2(-z, x);
	var phi2_over_pi = Math.acos(y) / Math.PI;
	var srcX = ((phi2_over_pi * Math.cos(theta2))+0.5)*srcWidth;
	var srcY = ((phi2_over_pi * Math.sin(theta2))+0.5)*srcHeight;
    }
    return [srcX, srcY];
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
    var outfill = "black";
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var [srcX, srcY] = fisheyeTransform(dstX, dstY, dstImageData,
						srcImageData);
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
