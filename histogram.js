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
    var equalize = document.getElementById("equalizeCheckbox");
    var equalizeRatioRange = document.getElementById("equalizeRatioRange");
    var equalizeRatioText  = document.getElementById ("equalizeRatioText");
    var maxValueRange = document.getElementById("maxValueRange");
    var minValueRange = document.getElementById("minValueRange");
    var maxValueText = document.getElementById("maxValueText");
    var minValueText = document.getElementById("minValueText");
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "equalizeCheckbox":null,
		  "equalizeRatioRange":"equalizeRatioText",
		  "maxValueRange":"maxValueText",
		  "minValueRange":"minValueText"},
		 function(target) {
		     console.debug(target.id);
		     var maxValue = parseFloat(document.getElementById("maxValueRange").value);
		     var minValue = parseFloat(document.getElementById("minValueRange").value);
		     if (target.id === "equalizeCheckbox")  {
			 if (equalize.checked) {
			     equalizeRatioRange.value = 255;
			     equalizeRatioText.value = 255;
			 } else {
			     equalizeRatioRange.value = 0
			     equalizeRatioText.value = 0;
			 }
		     } else if ((target.id === "equalizeRatioRange") ||
				(target.id === "equalizeRatioText")) {
			 if (equalizeRatioRange.value == 0) {
			     equalize.checked = false;
			 } else {
			     equalize.checked = true;
			 }
		     } else {
			 if (minValue > maxValue) {
			     if ((target.id === "maxValueRange") || (target.id === "maxValueText")) {
				 minValueRange.value = maxValue;
				 minValueText.value  = maxValue;
			     } else if ((target.id === "minValueRange") || (target.id === "minValueText")) {
				 maxValueRange.value = minValue;
				 maxValueText.value  = minValue;
			     }
			 }
		     }
		     drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas);
		 } );
}

function drawSrcImageAndHistogram(srcImage, srcCanvas, dstCancas, srcHistCanvas, dstHistCanvas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var equalizeRatio = parseFloat(document.getElementById("equalizeRatioRange").value);
    var maxValue = parseFloat(document.getElementById("maxValueRange").value);
    var minValue = parseFloat(document.getElementById("minValueRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalizeRatio, minValue, maxValue);
}

function drawHistgramGraph(histCanvas, redHist, greenHist, blueHist,
			   minValue, maxValue) {
    var height = histCanvas.height;
    histCanvas.style.backgroundColor = "black";
    histCanvas.height = height; // canvas clear
    var ctx = histCanvas.getContext("2d");
    ctx.globalCompositeOperation = "lighter";
    var processList = [["#F00", redHist],
		       ["#0F0", greenHist],
		       ["#00F", blueHist]];
    var max = 0;
    for (var i = 0; i < processList.length ; i++) {
	var [color, hist]  =  processList[i];
	for (var j = 0 ; j < 256 ; j++) {
	    var v = hist[j];
	    if (max < v) {
		max = v;
	    }
	}
    }
    for (var i = 0; i < processList.length ; i++) {
	var [color, hist]  =  processList[i];
	ctx.strokeStyle=color;
	for (var x = 0 ; x < 256 ; x++) {
	    var nColor = hist[x];
	    var y = height - (nColor * height/max) - 1;
	    ctx.beginPath();
	    ctx.moveTo(x+0.5, height);
	    ctx.lineTo(x+0.5, y+0.5);
	    ctx.stroke();
	}
    }
    ctx.fillStyle="gray";
    if (0 < minValue) {
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.rect(0, 0, minValue, height);
	ctx.fill();
    }
    if (maxValue < 255) {
 	ctx.beginPath();
	ctx.moveTo(maxValue+1, 0);
	ctx.rect(maxValue+1, 0, 256, height);
	ctx.fill();
    }
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
	if (i < minValue) {
	    map[i] = 0;
	} else if (maxValue < i) {
	    map[i] = 255;
	} else {
	    var c = hist[i];
	    if (c > 0) {
		count += c;
		map[i] = 255; // fail safe
		for (var j = 0; j < 256 ; j++) {
		    if (count <= (nColors / (maxValue-minValue) * (j-minValue+1))) {
			// level adjustment
			map[i] = levelAdjustment(j, minValue, maxValue, 0, 255);
			break;
		    }
		}
	    }
	}
    }
    return map;
}

function drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalizeRatio, minValue, maxValue) {
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
    drawHistgramGraph(srcHistCanvas, redHist, greenHist, blueHist, minValue, maxValue);
    if (equalizeRatio) {
	var colorMap = equalizeMap(redHist, greenHist, blueHist, minValue, maxValue);
    } else if (( 0 < minValue) || (maxValue< 255)) {
	var colorMap = new Uint8Array(256).map(function(n, i) {
	    return levelAdjustment(i, minValue, maxValue, 0, 255);
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
		setRGBA(dstImageData, dstX, dstY, [r, g, b, a]);
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    //
    var redHist   = getColorHistogramList(dstCanvas, "red");
    var greenHist = getColorHistogramList(dstCanvas, "green");
    var blueHist  = getColorHistogramList(dstCanvas, "blue");
    drawHistgramGraph(dstHistCanvas, redHist, greenHist, blueHist, 0, 255);
}
