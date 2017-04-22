"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var colorMatrixTable = document.getElementById("colorMatrixTable");
    var color = document.getElementById("colorSelect").value;
    var colorMatrix = color2Matrix[color];
    var colorWindow = 4;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix, colorWindow);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix, colorWindow);
		 } );
    bindFunction({"colorSelect":null},
		 function() {
		     color = document.getElementById("colorSelect").value;
		     colorMatrix = color2Matrix[color];
		     console.log(colorMatrix);
		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix, colorWindow);
		     setTableValues("colorMatrixTable", colorMatrix);
		 } );
    //
    bindTableFunction("colorMatrixTable", function(table, values, width) {
	colorMatrix = values;
	drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix, colorWindow);
    }, colorMatrix, colorWindow);
    console.log(colorMatrixTable);
}

var color2Matrix = {
    // colorName:[
    // colorMatrix],
    "ident":[
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0],
    "red-p":[
	1.1, 0, 0, 0.1,
  	0  , 1, 0, 0,
	0  , 0, 1, 0],
    "green-p":[
	1, 0  , 0, 0,
	0, 1.1, 0, 0.1,
	0, 0  , 1, 0],
    "blue-p":[
	1, 0, 0  , 0,
	0, 1, 0  , 0,
	0, 0, 1.1, 0.1],
    "rgb2gbr":[
	0, 1, 0, 0,
	0, 0, 1, 0,
	1, 0, 0, 0],
    "rgb2brg":[
	0, 0, 1, 0,
	1, 0, 0, 0,
	0, 1, 0, 0],
    "negate":[
	-1, 0, 0, 1,
	0, -1, 0, 1,
	0, 0, -1, 1],

};

function drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCancas, colorMatrix, colorWindow) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorTransform(srcCanvas, dstCanvas, colorMatrix, colorWindow);
}

function colorTransform(imageData, x, y, mat) {
    var [r, g, b, a] = getRGBA(imageData, x, y);
    var r2 = r*mat[0] + g*mat[1] + b*mat[2]  + 255*mat[3];
    var g2 = r*mat[4] + g*mat[5] + b*mat[6]  + 255*mat[7];
    var b2 = r*mat[8] + g*mat[9] + b*mat[10] + 255*mat[11];
    return [r2, g2, b2, a];
}

function drawColorTransform(srcCanvas, dstCanvas, colorMatrix, colorWindow) {
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
	    var srcX = dstX, srcY = dstY;
	    var rgba = colorTransform(srcImageData, srcX, srcY, colorMatrix);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
