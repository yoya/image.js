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
	    drawSrcImageAndResize(srcImage, srcCanvas, dstCanvas);
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
		     drawSrcImageAndResize(srcImage, srcCanvas, dstCanvas);
		 } );
}

function drawSrcImageAndResize(srcImage, srcCanvas, dstCancas) {
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
    drawResize(srcCanvas, dstCanvas, params);
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


function drawResize(srcCanvas, dstCanvas, params) {
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
	    var [r,g,b,a] = resizePixel(srcX, srcY, srcImageData, filterType, filterKernel);
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
    return getPixel(imageData, x >>> 0, y >>> 0);
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

function resizePixel(srcX, srcY, srcImageData, filterType, filterKernel) {
    var rgba = null;
    switch (filterType) {
    case "NN":
	rgba = getPixel_NN(srcImageData, srcX, srcY);
	break;
    case "BiLinear":
	rgba = getPixel_BiLinear(srcImageData, srcX, srcY);
	break;
    default:
	break;
    }
    return rgba;
}

function cubicBCcoefficient(b, c) {
    var p = 12 - 9 * b - 6 * c;
    var q = -18 + 12 * b + 6 * c;
    var r = 0;
    var s = 6 - 2 * b;
    var t = -b - 6 * c;
    var u = 6 * b + 30 * c;
    var v = -12 * b - 48 * c;
    var w = 8 * b + 24 * c;
    return [p, q, r, s, t, u, v, w];
}
function cubicBC(x, coeff) {
    var [p, q, r, s, t, u, v, w] = coeff;
    var y = 0;
    var ax = Math.abs(x);
    if (ax < 1) {
	y = (1/6) * (p*(ax*ax*ax) + q*(ax*ax) + r*(ax) + s);
    } else if (ax < 2) {
	y = (1/6) * (t*(ax*ax*ax) + u*(ax*ax) + v*(ax) + w);
    }
    return y;
}

function sinc(x) {
    var pi_x = Math.PI * x;
    return Math.sin(pi_x) / pi_x;
}

function sincFast(x) {
    var xx = x * x;
    // quantim depth 8
    var c0 = 0.173610016489197553621906385078711564924e-2;
    var c1 = -0.384186115075660162081071290162149315834e-3;
    var c2 = 0.393684603287860108352720146121813443561e-4;
    var c3 = -0.248947210682259168029030370205389323899e-5;
    var c4 = 0.107791837839662283066379987646635416692e-6;
    var c5 = -0.324874073895735800961260474028013982211e-8;
    var c6 = 0.628155216606695311524920882748052490116e-10;
    var c7 = -0.586110644039348333520104379959307242711e-12;
    var p =
	c0+xx*(c1+xx*(c2+xx*(c3+xx*(c4+xx*(c5+xx*(c6+xx*c7))))));
    return (xx-1.0)*(xx-4.0)*(xx-9.0)*(xx-16.0)*p;
}

function lanczos(x, lobe) {
    if (x === 0) {
	return 0;
    }
    if (Math.abs(x) < lobe) {
	//return sinc(x) * sinc(x/lobe);
	return sincFast(x) * sincFast(x/lobe);
    }
    return 0;
}
