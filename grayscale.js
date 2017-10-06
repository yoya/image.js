"use strict";
/*
 * 2017/04/17- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvasArr = document.querySelectorAll(".dstCanvas");
    console.log(dstCanvasArr);
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr);
		 } );
}

function drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    dstCanvasArr.forEach(function(dstCanvas) {
	var equation = dstCanvas.parentNode.innerText;
	console.debug("equation", equation);
	drawGrayscale(srcCanvas, dstCanvas, equation);
    });
}

function drawGrayscale(srcCanvas, dstCanvas, equation) {
    // console.debug("drawColorTransform");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width = width;
    dstCanvas.height = height;
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var dstImageData = dstCtx.createImageData(width, height);
    var func = new Function("R","G","B", "return " + equation);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    var v = func(r, g, b);
	    var rgba = [v, v, v, a];
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
