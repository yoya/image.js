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
		  "multiRedRange":"multiRedText", "multiGreenRange":"multiGreenText", "multiBlueRange":"multiBlueText",
		  "sigmoidRedRange":"sigmoidRedText", "sigmoidGreenRange":"sigmoidGreenText", "sigmoidBlueRange":"sigmoidBlueText"},
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
    var sigmoidRed    = parseFloat(document.getElementById("sigmoidRedRange").value);
    var sigmoidGreen  = parseFloat(document.getElementById("sigmoidGreenRange").value);
    var sigmoidBlue   = parseFloat(document.getElementById("sigmoidBlueRange").value);
    drawColorTransform(srcCanvas, dstCanvas,
		       addRed, addGreen, addBlue,
		       multiRed, multiGreen, multiBlue,
		       sigmoidRed, sigmoidGreen, sigmoidBlue);
}


function drawColorTransform(srcCanvas, dstCanvas,
			    addRed, addGreen, addBlue,
			    multiRed, multiGreen, multiBlue,
			    sigmoidRed, sigmoidGreen, sigmoidBlue) {
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
    // -1.0 ~ 0 ~ 1.0 => 50 ~ 0 ~ 50
    var sig_A_red   = Math.abs(sigmoidRed)   * 50;
    var sig_A_green = Math.abs(sigmoidGreen) * 50;
    var sig_A_blue  = Math.abs(sigmoidBlue)  * 50;
    // -1.0 ~ 1.0 => -0.5 ~ 1.5
    var sig_B_red   = 0.5 - sigmoidRed ;
    var sig_B_green = 0.5 - sigmoidGreen;
    var sig_B_blue  = 0.5 - sigmoidBlue;
    var sig0_red   = sigmoid(0.0, sig_A_red,   sig_B_red);
    var sig1_red   = sigmoid(1.0, sig_A_red,   sig_B_red);
    var sig0_green = sigmoid(0.0, sig_A_green, sig_B_green);
    var sig1_green = sigmoid(1.0, sig_A_green, sig_B_green);
    var sig0_blue  = sigmoid(0.0, sig_A_blue,  sig_B_blue);
    var sig1_blue  = sigmoid(1.0, sig_A_blue,  sig_B_blue);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
	    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
	    r = r * multiRed   + addRed;
	    g = g * multiGreen + addGreen;
	    b = b * multiBlue  + addBlue;
	    if (sigmoidRed) {
		r /= 255;
		r = (sigmoid(r, sig_A_red, sig_B_red) - sig0_red)
		    / (sig1_red - sig0_red);
		r *= 255;
	    }
	    if (sigmoidGreen) {
		g /= 255;
		g = (sigmoid(g, sig_A_green, sig_B_green) - sig0_green) /
		    (sig1_green - sig0_green);
		g *= 255;
	    }
	    if (sigmoidBlue) {
		b /= 255;
		b = (sigmoid(b, sig_A_blue, sig_B_blue) - sig0_blue) /
		    (sig1_blue - sig0_blue);
		b *= 255;
	    }
	    var rgba = [r, g, b, a];
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
