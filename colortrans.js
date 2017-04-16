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
	    drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "addRedRange":"addRedText", "addGreenRange":"addGreenText", "addBlueRange":"addBlueText",
		  "multiRedRange":"multiRedText", "multiGreenRange":"multiGreenText", "multiBlueRange":"multiBlueText"},
		 function() {
		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var addRed    = parseFloat(document.getElementById("addRedRange").value);
    var addGreen  = parseFloat(document.getElementById("addGreenRange").value);
    var addBlue   = parseFloat(document.getElementById("addBlueRange").value);
    var multiRed    = parseFloat(document.getElementById("multiRedRange").value);
    var multiGreen  = parseFloat(document.getElementById("multiGreenRange").value);
    var multiBlue   = parseFloat(document.getElementById("multiBlueRange").value);
    drawColorTransform(srcCanvas, dstCanvas,
		       addRed, addGreen, addBlue,
		       multiRed, multiGreen, multiBlue);
}


function drawColorTransform(srcCanvas, dstCanvas,
			    addRed, addGreen, addBlue,
			    multiRed, multiGreen, multiBlue) {
    // console.debug("drawColorTransform");
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
	    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
	    r = r * multiRed   + addRed;
	    g = g * multiGreen + addGreen;
	    b = b * multiBlue  + addBlue;
	    var rgba = [r, g, b, a];
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
