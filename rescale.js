"use strict";
// require func.js
// require bind.js
// require graph.js
// require image.js

main();

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "filterType":null,
		  "scaleRange":"scaleText",
		  "cubicBRange":"cubicBText",
		  "cubicCRange":"cubicCText",
		  "lobeRange":"lobeText"},
		 function() {
		     drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
		 } );
}

function drawSrcImageAndRescale(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var params = {
	filterType: document.getElementById("filterType").value,
	scale: parseFloat(document.getElementById("scaleRange").value),
	cubicB:parseFloat(document.getElementById("cubicBRange").value),
	cubicC:parseFloat(document.getElementById("cubicCRange").value),
	lobe:  parseFloat(document.getElementById("lobeRange").value)
    };
    drawGraph(params)
    drawRescale(srcCanvas, dstCanvas, params);
}

function makeFilterKernel(params, srcWidth, srcHeight, dstWidth, dstHeight) {
    if (srcWidth < dstWidth) {
	var [width1, width2] = [srcWidth, dstWidth];
    } else {
	var [width1, width2] = [dstWidth, srcWidth];
    }
    if (srcHeight < dstHeight) {
	var [height1, height2] = [srcHeight, dstHeight];
    } else {
	var [height1, height2] = [dstHeight, srcHeight];
    }
    var kernelWidthScale  = width2 / width1
    var kernelHeightScale = height2 / height1
    var kernelWidth  = Math.ceil(2 * kernelWidthScale);
    var kernelHeight = Math.ceil(height2 / height1);
    var kernelScale = 1;
    var filterType = params["filterType"];
    switch (filterType) {
    case "NN":
	return null; // 存在しない
    case "BiLinear":
	kernelScale = 1;
	break;
    case "BiCubic":
	kernelScale = 2;
	break;
    case "Lanczos":
	var lobe = params["lobe"];
	kernelScale = lobe;
    }
    var kernel = new Array(kernelWidth * kernelHeight * kernelScale * kernelScale);
    
    return kernel;
}


function drawRescale(srcCanvas, dstCanvas, params) {
    var scale = params.scale;
    var srcWidth  = srcCanvas.width;
    var srcHeight = srcCanvas.height;
    var dstWidth  = Math.round(scale * srcWidth);
    var dstHeight = Math.round(scale * srcHeight);
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var dstData = dstImageData.data;
    var filterType = params.filterType;
    var filterKernel = makeFilterKernel(params, srcWidth, srcHeight, dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
	for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var dstOffset = 4 * (dstX + dstY * dstWidth);
	    var srcX = dstX / scale;
	    var srcY = dstY / scale;
	    var [r,g,b,a] = rescalePixel(srcX, srcY, srcImageData, filterType, filterKernel);
	    dstData[dstOffset]   = r;
	    dstData[dstOffset+1] = g;
	    dstData[dstOffset+2] = b;
	    dstData[dstOffset+3] = a;
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

function getPixel(imageData, x, y) {
    var data = imageData.data;
    var width  = imageData.width;
    var height = imageData.height;
    x = (x < 0)? 0 : ((x < width )?x:width -1);
    y = (y < 0)? 0 : ((y < height)?y:height-1);
    var offset = 4 * (x + y * width);
    return data.slice(offset, offset+4); // [r,g,b,a]
}

function getPixel_NN(imageData, x, y) {
    return getPixel(imageData, Math.floor(x), Math.floor(y));
}

function linearRatio([a, b], p) {
    if (a === b) {
	return [0.5, 0.5];
    }
    var aRatio = (b - p) / (b - a);
    return [aRatio, 1 - aRatio];
}

function getPixel_BiLinear(imageData, x, y) {
    var data = imageData.data;
    var width  = imageData.width;
    var height = imageData.height;
    var x1 = Math.floor(x), x2 = Math.ceil(x);
    var y1 = Math.floor(y), y2 = Math.ceil(y);
    if (x1 < 0) {
	x1 = 0;
    } else if (width <= x2) {
	x2 = width - 1;
    }
    if (y1 < 0) {
	y1 = 0;
    } else if (height <= y2) {
	y2 = height - 1;
    }
    var rgba = [0, 0, 0, 0];
    var [rx1, rx2] = linearRatio([x1, x2], x);
    var [ry1, ry2] = linearRatio([y1, y2], y);
    var r11 = rx1 * ry1;
    var r12 = rx1 * ry2;
    var r21 = rx2 * ry1;
    var r22 = rx2 * ry2;
    var rgba11 = getPixel(imageData, x1, y1);
    var rgba12 = getPixel(imageData, x1, y2);
    var rgba21 = getPixel(imageData, x2, y1);
    var rgba22 = getPixel(imageData, x2, y2);
    for (var i = 0 ; i < 4 ; i++) {
	rgba[i] = r11 * rgba11[i] +  r12 * rgba12[i] + r21 * rgba21[i] + r22 * rgba22[i];
    }
    return rgba;
}

function rescalePixel(srcX, srcY, srcImageData, filterType, filterKernel) {
    var rgba = null;
    switch (filterType) {
    case "NN":
	rgba = getPixel_NN(srcImageData, srcX, srcY);
	break;
    case "BiLinear":
	rgba = getPixel_BiLinear(srcImageData, srcX, srcY);
	break;
    default:
	rgba = [255, 0, 0, 255];
	break;
    }
    return rgba;
}
