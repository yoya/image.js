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
	    drawSrcImageAndColorReduction(srcImage, srcCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndColorReduction(srcImage, srcCanvas);
		 } );
}

function drawSrcImageAndColorReduction(srcImage, srcCanvas) {
    var div = loadingStart();
    var id = setTimeout(function() {
	drawSrcImageAndColorReduction_(srcImage, srcCanvas);
	loadingEnd(div);
    }, 100);
}

function drawSrcImageAndColorReduction_(srcImage, srcCanvas) {
    var quantizeMethod = document.getElementById("quantizeMethod").value;
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    document.getElementById("nColorSrc").value = "";
    document.getElementById("nColorDst").value = "";
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    document.getElementById("nColorSrc").value = getColorNum(srcCanvas);
    drawColorReduction(srcCanvas, dstCanvas,quantizeMethod);
    document.getElementById("nColorDst").value = getColorNum(dstCanvas);

    var paletteCanvas = document.getElementById("paletteCanvas");
    var paletteHist = getColorHistogram(dstCanvas);
    var paletteNum = Object.keys(paletteHist).length;
    var palette = new Uint32Array(paletteNum);
    var i = 0;
    for (var colorId in paletteHist) {
	colorId = parseFloat(colorId);
	palette[i] = colorId;
	i++;
    }
    drawPalette(paletteCanvas, palette);
}

function drawColorReduction(srcCanvas, dstCanvas, quantizeMethod) {
    switch (quantizeMethod) {
    case "uniform": // 均等量子化法
	drawColorReduction_uniform(srcCanvas, dstCanvas);
	break;
    case "popularity": // 頻度法
	drawColorReduction_popularity(srcCanvas, dstCanvas);
	break;
    default:
	console.error("Unknown quantizeMethod:"+quantizeMethod);
	break;
    }
}

/*
 * 均等量子化法 (uniform quqntization)
 */
function drawColorReduction_uniform(srcCanvas, dstCanvas) {
    // console.debug("drawColorReduction");
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
    for (var srcY = 0 ; srcY < srcHeight; srcY++) {
        for (var srcX = 0 ; srcX < srcWidth; srcX++) {
	    var dstX = srcX, dstY = srcY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    var [r,g,b] = rgba;
//	    rgba[0] = Math.round(r * 7 / 0xff) * 0xff / 7;
//	    rgba[1] = Math.round(g * 5 / 0xff) * 0xff / 5;
//	    rgba[2] = Math.round(b * 4 / 0xff) * 0xff / 4;
	    rgba[0] = (r & 0xe0) + (0xff-0xe0)/2 // 1110 0000
	    rgba[1] = (g & 0xe0) + (0xff-0xe0)/2 // 1110 0000
	    rgba[2] = (b & 0xc0) + (0xff-0xc0)/2 // 1100 0000
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

/*
 * 頻度法 popularity algorithm
 */
function drawColorReduction_popularity(srcCanvas, dstCanvas) {
    // console.debug("drawColorReduction");
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
    var hist = getColorHistogram(srcCanvas);
    var colorNum = Object.keys(hist).length;
    var histArray = [];
    for (var colorId in hist) {
	colorId = parseFloat(colorId);
	histArray.push({colorId:colorId, count:hist[colorId]});
    }
    console.debug("HistogramSort");
    console.time("HistogramSort");
    histArray.sort(function(a, b) {
	return (a.count < b.count)?1:-1; // descend order
    });
    console.timeEnd("HistogramSort");
    var paletteNum = (colorNum < 256)?colorNum:256;
    var palette = new Uint32Array(paletteNum);
    var colorId = null;
    var colorMap = {}
    console.debug("ColorMapMaking");
    console.time("ColorMapMaking");
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
	// console.debug(colorId2RGBA(colorId), colorId2RGBA(closestId), closestDistance);
    }
    console.timeEnd("ColorMapMaking");
    for (var srcY = 0 ; srcY < srcHeight; srcY++) {
        for (var srcX = 0 ; srcX < srcWidth; srcX++) {
	    var dstX = srcX, dstY = srcY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    colorId = RGBA2colorId(rgba);
	    colorId = colorMap[colorId];
	    rgba = colorId2RGBA(colorId);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
