"use strict";
/*
 * 2018/11/10- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function sepiaToneMatrix(amount, matrix) {
    var a = 1 - amount;
    var colorMatrix;
    switch (matrix) {
    case "GOOD":  // https://www.w3.org/TR/filter-effects/#sepiaEquivalent
	colorMatrix = [
	    (0.393 + 0.607 * a), (0.769 - 0.769 * a), (0.189 - 0.189 * a), 0,
	    (0.349 - 0.349 * a), (0.686 + 0.314 * a), (0.168 - 0.168 * a), 0,
	    (0.272 - 0.272 * a), (0.534 - 0.534 * a), (0.131 + 0.869 * a), 0 ];
	break;
    case "SOSO":  // (GOOD+BAD)/ 2
	colorMatrix = [
	    (0.346 + 0.654 * a), (0.678 - 0.678 * a), (0.151 - 0.151 * a), 0,
	    (0.278 - 0.278 * a), (0.546 + 0.454 * a), (0.124 - 0.124 * a), 0, 
	    (0.196 - 0.196 * a), (0.385 - 0.385 * a), (0.089 + 0.911 * a), 0 ];
	break;
    case "BAD":  // http://k-ichikawa.blog.enjoy.jp/etc/HP/htm/imageSepia.html
	colorMatrix = [
	    (0.299 + 0.701 * a), (0.587 - 0.587 * a), (0.114 - 0.114 * a), 0,
	    (0.207 - 0.207 * a), (0.406 + 0.594 * a), (0.079 - 0.079 * a), 0, 
	    (0.120 - 0.120 * a), (0.236 - 0.236 * a), (0.046 + 0.954 * a), 0 ];
	break;
    default:
	console.error("wrong matrixSelect");
    }
    return colorMatrix;
}

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var matrixSelect = document.getElementById("matrixSelect");
    var matrix = matrixSelect.value;
    var colorMatrixTable = document.getElementById("colorMatrixTable");
    var amountRange = document.getElementById("amountRange");
    var amount = parseFloat(amountRange.value);
    var colorMatrix = sepiaToneMatrix(amount, matrix);
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
		  "linearCheckbox":null,
                  "radiusRange":"radiusText"},
		 function() {
		     drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
		 } );
    bindFunction({"amountRange":"amountText",
                  "matrixSelect":null},
		 function() {
		     amount = parseFloat(amountRange.value);
		     matrix = matrixSelect.value;
		     colorMatrix = sepiaToneMatrix(amount, matrix);
		     setTableValues("colorMatrixTable", colorMatrix);
		     drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
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
    var radius = parseFloat(document.getElementById("radiusRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSepiaTone(srcCanvas, dstCanvas, colorMatrix, linear, radius);
}

function colorTransform(rgb, mat) {
    var [r, g, b] = rgb;
    var r2 = r*mat[0] + g*mat[1] + b*mat[2]  + 255*mat[3];
    var g2 = r*mat[4] + g*mat[5] + b*mat[6]  + 255*mat[7];
    var b2 = r*mat[8] + g*mat[9] + b*mat[10] + 255*mat[11];
    return [r2, g2, b2];
}

function sepiaTone(rgba, colorMatrix) {
    var [r, g, b, a] = rgba;
    [r,g,b] = colorTransform([r,g,b], colorMatrix)
    return [r, g, b, a];
}

function drawSepiaTone(srcCanvas, dstCanvas, colorMatrix, linear, radius) {
    // console.debug("drawSepiaTone");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var dstImageData = dstCtx.createImageData(width, height);
    var slant = Math.sqrt(width*width + height*height);
    slant *= radius;
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
            if (linear) {
	        [r, g, b] = sRGB2linearRGB([r,g,b]);
	        r *= 255; g *= 255; b *= 255;
            }
            var dx = (x - (width  / 2)) / (slant/2);
            var dy = (y - (height / 2)) / (slant/2);
            var r = Math.sqrt(dx*dx + dy*dy);
	    var factor = Math.pow(Math.cos(r/2), 4);
            //
	    var rgba = getRGBA(srcImageData, x, y);
	    var [r, g, b, a] = sepiaTone(rgba, colorMatrix);
	    r *= factor;
	    g *= factor;
	    b *= factor;
            if (linear) {
	        r /= 255; g /= 255; b /= 255;
	        [r, g, b] = linearRGB2sRGB([r, g, b]);
            }
	    setRGBA(dstImageData, x, y, [r, g, b, a]);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
