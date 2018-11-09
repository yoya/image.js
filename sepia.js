"use strict";
/*
 * 2018/11/10- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

// https://www.w3.org/TR/filter-effects/#sepiaEquivalent
function sepiaToneMatrix(amount) {
    var a = 1 - amount;
    var colorMatrix = [
	(0.393 + 0.607 * a), (0.769 - 0.769 * a), (0.189 - 0.189 * a), 0,
        (0.349 - 0.349 * a), (0.686 + 0.314 * a), (0.168 - 0.168 * a), 0,
        (0.272 - 0.272 * a), (0.534 - 0.534 * a), (0.131 + 0.869 * a), 0 ];
    return colorMatrix;
}

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var colorMatrixTable = document.getElementById("colorMatrixTable");
    var amountRange = document.getElementById("amountRange");
    var amount = parseFloat(amountRange.value);
    var colorMatrix = sepiaToneMatrix(amount);
    var colorWindow = 4;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "linearCheckbox":null},
		 function() {
		     drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
		 } );
    bindFunction({"amountRange":"amountText"},
		 function() {
		     amount = parseFloat(amountRange.value);
		     colorMatrix = sepiaToneMatrix(amount);
		     drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
		     setTableValues("colorMatrixTable", colorMatrix);
		 } );
    //
    bindTableFunction("colorMatrixTable", function(table, values, width) {
	colorMatrix = values;
	drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
    }, colorMatrix, colorWindow);
    console.log(colorMatrixTable);
}


function drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCancas, colorMatrix) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var linear = document.getElementById("linearCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSepiaTone(srcCanvas, dstCanvas, colorMatrix, linear);
}

function colorTransform(imageData, x, y, mat, linear) {
    var [r, g, b, a] = getRGBA(imageData, x, y);
    if (linear) {
	[r, g, b] = sRGB2linearRGB([r, g, b]);
	r *= 255; g *= 255; b *= 255;
    }
    var r2 = r*mat[0] + g*mat[1] + b*mat[2]  + 255*mat[3];
    var g2 = r*mat[4] + g*mat[5] + b*mat[6]  + 255*mat[7];
    var b2 = r*mat[8] + g*mat[9] + b*mat[10] + 255*mat[11];
    if (linear) {
	r2 /= 255; g2 /= 255; b2 /= 255;
	[r2, g2, b2] = linearRGB2sRGB([r2, g2, b2]);
    }
    return [r2, g2, b2, a];
}

function drawSepiaTone(srcCanvas, dstCanvas, colorMatrix, linear) {
    // console.debug("drawSepiaTone");
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
	    var srcX = dstX, srcY = dstY;
	    var rgba = colorTransform(srcImageData, srcX, srcY, colorMatrix, linear);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
