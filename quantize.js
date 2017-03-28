"use strict";
/*
 * 2017/03/17- (c) yoya@awm.jp
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
	    drawSrcImageAndQuantize(srcImage, srcCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction("range2text", {"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndQuantize(srcImage, srcCanvas);
		 } );
    bindFunction("range2text", {"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndQuantize(srcImage, srcCanvas);
		 } );
}

function drawSrcImageAndQuantize(srcImage, srcCanvas) {
    var quantizeMethod = document.getElementById("quantizeMethod").value;
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawQuantize(srcCanvas, dstCanvas,quantizeMethod);
}

function drawQuantize(srcCanvas, dstCanvas, quantizeMethod) {
    switch (quantizeMethod) {
    case "equalQuantize":
	drawQuantize_equalQuantize(srcCanvas, dstCanvas);
	break;
    case "frequency":
	drawQuantize_frequency(srcCanvas, dstCanvas);
	break;
    default:
	console.error("Unknown quantizeMethod:"+quantizeMethod);
	break;
    }
    document.getElementById("nColorSrc").value = getColorNum(srcCanvas);
    document.getElementById("nColorDst").value = getColorNum(dstCanvas);
}

function drawQuantize_equalQuantize(srcCanvas, dstCanvas) {
    // console.debug("drawQuantize");
    //
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = srcWidth, dstHeight = srcHeight;
    dstCanvas.width = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    for (var srcY = 0 ; srcY < srcHeight; srcY++) {
        for (var srcX = 0 ; srcX < srcWidth; srcX++) {
	    var dstX = srcX, dstY = srcY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    var [r,g,b] = rgba;
	    rgba[0] = (r & 0xe0) * 0xff / 0xe0; // 1110 0000
	    rgba[1] = (g & 0xe0) * 0xff / 0xe0; // 1110 0000
	    rgba[2] = (b & 0xc0) * 0xff / 0xc0; // 1100 0000
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

function drawQuantize_frequency(srcCanvas, dstCanvas) {
    // console.debug("drawQuantize");
    //
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = srcWidth, dstHeight = srcHeight;
    dstCanvas.width = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    var hist = getColorHistogram(srcCanvas);
    var colorNum = Object.keys(hist).length;
    var histArray = [];
    for (var colorId in hist) {
	colorId = parseFloat(colorId);
	histArray.push({colorId:colorId, count:hist[colorId]});
    }
    histArray.sort(function(a, b) {
	return (a.count < b.count)?1:-1; // descend order
    });
    var paletteNum = (colorNum < 256)?colorNum:256;
    var palette = new Uint32Array(paletteNum);
    var colorId = null;
    var colorMap = {}
    for (var i = 0 ; i < paletteNum ; i++) {
	colorId = histArray[i].colorId;
	palette[i] = colorId;
	colorMap[colorId]= colorId;
    }
    for (var i = paletteNum ; i < colorNum ; i++) {
	colorId = histArray[i].colorId;
	var closestId = palette[0];
	var closestDistance = getColorIdDistance_nosqrt(colorId, closestId);
	for (var j = 1 ; j < paletteNum ; j++) {
	    var distance = getColorIdDistance_nosqrt(colorId, palette[j]);
	    if (distance < closestDistance) {
		closestId = palette[j];
		closestDistance = distance;
	    }
	}
	colorMap[colorId] = closestId;
    }
    for (var srcY = 0 ; srcY < srcHeight; srcY++) {
        for (var srcX = 0 ; srcX < srcWidth; srcX++) {
	    var dstX = srcX, dstY = srcY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    var colorId = RGBA2colorId(rgba);
	    colorId = colorMap[colorId];
	    rgba = colorId2RGBA(colorId);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
