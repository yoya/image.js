"use strict";
/*
 * 2017/04/17- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var histCanvas = document.getElementById("histCanvas");
    var diffhistCanvas = document.getElementById("diffhistCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var thresholdRange = document.getElementById("thresholdRange");
    var thresholdText  = document.getElementById("thresholdText");
    var ptileRange = document.getElementById("ptileRange");
    var ptileText  = document.getElementById("ptileText");
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    // console.debug(srcImage);
		     drawSrcImageAndGetHistogram(srcImage, srcCanvas);
                     drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "grayscaleCheckbox":null},
		 function(target, rel) {
		     drawSrcImageAndGetHistogram(srcImage, srcCanvas);
                     drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, rel);
		 } );
    bindFunction({"thresholdRange":"thresholdText",
                  "pTileRange":"pTileText",
		  "ditherSelect":null,
                  "totalLineCheckbox":null, "histogramCheckbox":null},
		 function(target, rel) {
                     if ((target.id == "thresholdRange") ||
                         (target.id == "thresholdText")) {
                         var threshold = parseFloat(thresholdRange.value);
                         var ptile = getThresholdToPtile(threshold, hist);
                         pTileRange.value = ptile;
                         pTileText.value = ptile;
                     }
                     if ((target.id == "pTileRange") ||
                         (target.id == "pTileText")) {
                         var ptile = parseFloat(pTileRange.value);
                         var th = getThresholdFromTile(ptile, hist);
                         thresholdRange.value = th;
                         thresholdText.value = th;
                     }
                     drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, rel);
		 } );
}

var hist     = [null, null, null];
var diffhist = [null, null, null];
var laphist  = [null, null, null];

function drawSrcImageAndGetHistogram(srcImage, srcCanvas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var grayscale = document.getElementById("grayscaleCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    //
    if (grayscale) {
        drawGrayImage(srcCanvas, srcCanvas)
        hist[0]     = getColorHistogramList(srcCanvas, "red");
        diffhist[0] = getColorDifferentialHistogramList(srcCanvas, "red");
        laphist[0]  = getColorLaplacianHistogramList(srcCanvas, "red");
        hist[2] = hist[1] = hist[0];
        diffhist[2] = diffhist[1] = diffhist[0];
        laphist[2] = laphist[1] = laphist[0];
    } else {
        hist[0] = getColorHistogramList(srcCanvas, "red");
        hist[1] = getColorHistogramList(srcCanvas, "green");
        hist[2] = getColorHistogramList(srcCanvas, "blue");
        diffhist[0] = getColorDifferentialHistogramList(srcCanvas, "red");
        diffhist[1] = getColorDifferentialHistogramList(srcCanvas, "green");
        diffhist[2] = getColorDifferentialHistogramList(srcCanvas, "blue");
        laphist[0] = getColorLaplacianHistogramList(srcCanvas, "red");
        laphist[1] = getColorLaplacianHistogramList(srcCanvas, "green");
        laphist[2] = getColorLaplacianHistogramList(srcCanvas, "blue");
    }
}

function getThresholdToPtile(threshold, hist) {
    if (hist[0] === null) {
        return 0;
    }
    var channels = hist.length;
    var histogramArea = 0;
    var histogramAreaTotal = 0;
    for (var c = 0 ; c < channels ; c++) {
        var h = hist[c];
        for (var i = 0 ; i < 256 ; i++) {
            if (i < threshold) {
                histogramArea += h[i];
            }
            histogramAreaTotal += h[i];
        }
    }
    if (histogramAreaTotal === 0) {
        console.error("histogramAreaTotal === 0");
        return 0;
    }
    return  (100 * histogramArea / histogramAreaTotal) | 0;
}

function getThresholdFromTile(ptile, hist) {
    if (hist[0] === null) {
        return 0;
    }
    var channels = hist.length;
    var histogramAreaTotal = 0;
    for (var c = 0 ; c < channels ; c++) {
        var h = hist[c];
        for (var i = 0 ; i < 256 ; i++) {
            histogramAreaTotal += h[i];
        }
    }
    var histogramPtile = 0;
    ptile /= 100;
    for (var i = 0 ; i < 256 ; i++) {
        for (var c = 0 ; c < channels ; c++) {
            var h = hist[c];
            histogramPtile += h[i];
            if (ptile <= (histogramPtile / histogramAreaTotal)) {
                return i;
            }
        }
    }
    return 255;
}

function drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, sync) {
    var threshold = parseFloat(document.getElementById("thresholdRange").value);
    var grayscale = document.getElementById("grayscaleCheckbox").checked;
    var dither = document.getElementById("ditherSelect").value;
    var histogram = document.getElementById("histogramCheckbox").checked;
    var totalLine = document.getElementById("totalLineCheckbox").checked;
    var params = {threshold:threshold,
		  grayscale:grayscale,
                  dither:dither};
    drawHistgramGraph(histCanvas, hist[0], hist[1], hist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(diffhistCanvas, diffhist[0], diffhist[1], diffhist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(laphistCanvas, laphist[0], laphist[1], laphist[2], 0, threshold, totalLine, histogram);
    drawBinarize(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess("worker/binarize.js");

function drawBinarize(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
}
