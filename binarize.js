"use strict";
/*
 * 2017/04/17- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const histCanvas = document.getElementById("histCanvas");
    const diffhistCanvas = document.getElementById("diffhistCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    const thresholdRange = document.getElementById("thresholdRange");
    const thresholdText  = document.getElementById("thresholdText");
    const ptileRange = document.getElementById("ptileRange");
    const ptileText  = document.getElementById("ptileText");
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
                         const threshold = parseFloat(thresholdRange.value);
                         const ptile = getThresholdToPtile(threshold, hist);
                         pTileRange.value = ptile;
                         pTileText.value = ptile;
                     }
                     if ((target.id == "pTileRange") ||
                         (target.id == "pTileText")) {
                         const ptile = parseFloat(pTileRange.value);
                         const th = getThresholdFromTile(ptile, hist);
                         thresholdRange.value = th;
                         thresholdText.value = th;
                     }
                     drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, rel);
		 } );
}

const hist     = [null, null, null];
const diffhist = [null, null, null];
const laphist  = [null, null, null];

function drawSrcImageAndGetHistogram(srcImage, srcCanvas) {
    const maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    const grayscale = document.getElementById("grayscaleCheckbox").checked;
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
    const channels = hist.length;
    let histogramArea = 0;
    let histogramAreaTotal = 0;
    for (let c = 0 ; c < channels ; c++) {
        const h = hist[c];
        for (let i = 0 ; i < 256 ; i++) {
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
    const channels = hist.length;
    let histogramAreaTotal = 0;
    for (const c = 0 ; c < channels ; c++) {
        const h = hist[c];
        for (const i = 0 ; i < 256 ; i++) {
            histogramAreaTotal += h[i];
        }
    }
    let histogramPtile = 0;
    ptile /= 100;
    for (let i = 0 ; i < 256 ; i++) {
        for (let c = 0 ; c < channels ; c++) {
            const h = hist[c];
            histogramPtile += h[i];
            if (ptile <= (histogramPtile / histogramAreaTotal)) {
                return i;
            }
        }
    }
    return 255;
}

function drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, sync) {
    const threshold = parseFloat(document.getElementById("thresholdRange").value);
    const grayscale = document.getElementById("grayscaleCheckbox").checked;
    const dither = document.getElementById("ditherSelect").value;
    const histogram = document.getElementById("histogramCheckbox").checked;
    const totalLine = document.getElementById("totalLineCheckbox").checked;
    const params = {threshold:threshold,
		    grayscale:grayscale,
                    dither:dither};
    drawHistgramGraph(histCanvas, hist[0], hist[1], hist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(diffhistCanvas, diffhist[0], diffhist[1], diffhist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(laphistCanvas, laphist[0], laphist[1], laphist[2], 0, threshold, totalLine, histogram);
    drawBinarize(srcCanvas, dstCanvas, params, sync);
}

const worker = new workerProcess("worker/binarize.js");

function drawBinarize(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
}
