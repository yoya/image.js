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
    bindFunction({"thresholdRange":"thresholdText"},
		 function(target, rel) {
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

function drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, sync) {
    var threshold = parseFloat(document.getElementById("thresholdRange").value);
    var grayscale = document.getElementById("grayscaleCheckbox").checked;
    var params = {threshold:threshold,
		  grayscale:grayscale};
     var totalLine = true, histogram = true;
    drawHistgramGraph(histCanvas, hist[0], hist[1], hist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(diffhistCanvas, diffhist[0], diffhist[1], diffhist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(laphistCanvas, laphist[0], laphist[1], laphist[2], 0, threshold, totalLine, histogram);
    drawBinarize(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess("worker/binarize.js");

function drawBinarize(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
}
