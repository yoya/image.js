"use strict";
/*
 * 2017/04/23- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcHistCanvas = document.getElementById("srcHistCanvas");
    var dstHistCanvas = document.getElementById("dstHistCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     const { maxValue, minValue } = params;
		     if (key === "equalize")  {
			 params.equalizeRatio = params.equalize? 255: 0;
			 syncParamsToElements(params, {keys: ["equalizeRatio"]});
		     } else if (key === "equalizeRatio") {
			 params.equalize = (params.equalizeRatio != 0);
			 syncParamsToElements(params, {keys: ["equalize"]});
		     } else {
			 if (minValue > maxValue) {
			     if (key === "maxValue") {
				 params.minValue = maxValue;
				 syncParamsToElements(params, {keys: ["minValue"]});
			     } else if (key === "minValue") {
				 params.maxValue = minValue;
				 syncParamsToElements(params, {keys: ["maxValue"]});
			     }
			 }
		     }
		     drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, params);
		 }, {keys: ["maxWidthHeight", "equalize", "totalLine", "histogram", "equalizeRatio", "maxValue", "minValue"]});
}

function drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, params) {
    var { maxWidthHeight, equalizeRatio, maxValue, minValue, totalLine, histogram } = params;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalizeRatio, minValue, maxValue, totalLine, histogram);
}

function levelAdjustment(v, srcMinValue, srcMaxValue, dstMinValue, dstMaxValue) {
    if (v < srcMinValue) {
	return dstMinValue;
    } else if (srcMaxValue < v) {
	return dstMaxValue;
    }
    return dstMaxValue * (v - srcMinValue) / (srcMaxValue - srcMinValue) + dstMinValue;
}

function equalizeMap(redHist, greenHist, blueHist, minValue, maxValue) {
    var map = new Uint8Array(256);
    var hist = new Uint32Array(256).map(function(n, i) {
	if ((i < minValue) || (maxValue < i)) {
	    return 0;
	}
	return redHist[i] + greenHist[i] + blueHist[i];
    });
    var nColors = hist.reduce( function(prev, cur) { return prev + cur; });
    var count = 0;
    for (var i = 0; i < 256 ; i++) {
	if (i <= minValue) {
	    map[i] = 0;
	} else if (maxValue <= i) {
	    map[i] = 255;
	} else {
	    var c = hist[i];
	    if (c > 0) {
		count += c;
		map[i] = 255; // fail safe
		for (var j = 0; j < 256 ; j++) {
		    if (count <= (nColors / (maxValue-minValue) * (j-minValue+1))) {
			var v = levelAdjustment(j, minValue, maxValue, 0, 255);
			map[i] = Math.round(v);
			break;
		    }
		}
	    }
	}
    }
    return map;
}

function drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalizeRatio, minValue, maxValue, totalLine, histogram) {
    // console.debug("drawHistogram");
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
    var redHist   = getColorHistogramList(srcCanvas, "red");
    var greenHist = getColorHistogramList(srcCanvas, "green");
    var blueHist  = getColorHistogramList(srcCanvas, "blue");
    drawHistgramGraph(srcHistCanvas, redHist, greenHist, blueHist, minValue, maxValue, totalLine, histogram);
    if (equalizeRatio) {
	var colorMap = equalizeMap(redHist, greenHist, blueHist, minValue, maxValue);
    } else if (( 0 < minValue) || (maxValue< 255)) {
	var colorMap = new Uint8Array(256).map(function(n, i) {
	    var v = levelAdjustment(i, minValue, maxValue, 0, 255);
	    return Math.round(v);
	});
    } else {
	var colorMap = new Uint8Array(256).map(function(n, i) { return i; });
    }
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
	    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
	    if ((equalizeRatio === 0) || (equalizeRatio === 255)) {
		setRGBA(dstImageData, dstX, dstY, [colorMap[r], colorMap[g],
						   colorMap[b], a]);
	    } else {
		var ra = levelAdjustment(r, minValue, maxValue, 0, 255);
		var ga = levelAdjustment(g, minValue, maxValue, 0, 255);
		var ba = levelAdjustment(b, minValue, maxValue, 0, 255);
		r = (ra * (255 - equalizeRatio) + colorMap[r] * equalizeRatio) / 255;
		g = (ga * (255 - equalizeRatio) + colorMap[g] * equalizeRatio) / 255;
		b = (ba * (255 - equalizeRatio) + colorMap[b] * equalizeRatio) / 255;
		setRGBA(dstImageData, dstX, dstY, [Math.round(r), Math.round(g), Math.round(b), a]);
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    //
    var redHist   = getColorHistogramList(dstCanvas, "red");
    var greenHist = getColorHistogramList(dstCanvas, "green");
    var blueHist  = getColorHistogramList(dstCanvas, "blue");
    drawHistgramGraph(dstHistCanvas, redHist, greenHist, blueHist, 0, 255, totalLine, histogram);
}
