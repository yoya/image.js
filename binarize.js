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
	    drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, histCanvas, diffhistCanvas, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "thresholdRange":"thresholdText",
		  "grayscaleCheckbox":null},
		 function(target, rel) {
		     drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, histCanvas, diffhistCanvas, rel);
		 } );
}

function drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, histCanvas, diffhistCanvas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var threshold = parseFloat(document.getElementById("thresholdRange").value);
    var grayscale = document.getElementById("grayscaleCheckbox").checked;
    var params = {threshold:threshold,
		  grayscale:grayscale};
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
     var totalLine = true, histogram = true;
    if (grayscale) {
        var grayCanvas = document.createElement("canvas");
        drawGrayImage(srcCanvas, grayCanvas)
        var hist = getColorHistogramList(grayCanvas, "red");
	drawHistgramGraph(histCanvas, hist, hist, hist, 0, threshold,
                          totalLine, histogram);
        var hist = getColorDifferentialHistogramList(grayCanvas, "red");
	drawHistgramGraph(diffhistCanvas, hist, hist, hist, 0, threshold,
                          totalLine, histogram);
        drawBinary(grayCanvas, dstCanvas, params, sync);
    } else {
        var redHist   = getColorHistogramList(srcCanvas, "red");
        var greenHist = getColorHistogramList(srcCanvas, "green");
        var blueHist  = getColorHistogramList(srcCanvas, "blue");
        drawHistgramGraph(histCanvas, redHist, greenHist, blueHist, 0, threshold, totalLine, histogram);
        var redDiffHist   = getColorDifferentialHistogramList(srcCanvas, "red");
        var greenDiffHist = getColorDifferentialHistogramList(srcCanvas, "green");
        var blueDiffHist  = getColorDifferentialHistogramList(srcCanvas, "blue");
        drawHistgramGraph(diffhistCanvas, redDiffHist, greenDiffHist, blueDiffHist, 0, threshold, totalLine, histogram);
        drawBinary(srcCanvas, dstCanvas, params, sync);
    }
}

var worker = new workerProcess("worker/binarize.js");

function drawBinary(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
}
