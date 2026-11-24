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
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    // console.debug(srcImage);
		     drawSrcImageAndGetHistogram(srcImage, srcCanvas, params);
                     drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndGetHistogram(srcImage, srcCanvas, params);
                     drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, params, rel);
		 }, {keys: ["maxWidthHeight", "grayscale"]});
    bindParams(params, function(key, target, rel) {
                     if (key === "threshold") {
                         params.pTile = getThresholdToPtile(params.threshold, hist);
                         syncParamsToElements(params, {keys: ["pTile"]});
                     }
                     if (key === "pTile") {
                         params.threshold = getThresholdFromTile(params.pTile, hist);
                         syncParamsToElements(params, {keys: ["threshold"]});
                     }
                     drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, params, rel);
		 }, {keys: ["threshold", "pTile", "dither", "totalLine", "histogram"]});
}

const hist     = [null, null, null];
const diffhist = [null, null, null];
const laphist  = [null, null, null];

function drawSrcImageAndGetHistogram(srcImage, srcCanvas, params) {
    const { maxWidthHeight, grayscale } = params;
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
    for (let c = 0 ; c < channels ; c++) {
        const h = hist[c];
        for (let i = 0 ; i < 256 ; i++) {
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

function drawHistogramAndBinarize(srcCanvas, dstCanvas, histCanvas, diffhistCanvas, laphistCanvas, params, sync) {
    const { threshold, grayscale, dither, histogram, totalLine } = params;
    const params_w = {threshold:threshold,
		    grayscale:grayscale,
                    dither:dither};
    drawHistgramGraph(histCanvas, hist[0], hist[1], hist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(diffhistCanvas, diffhist[0], diffhist[1], diffhist[2], 0, threshold, totalLine, histogram);
    drawHistgramGraph(laphistCanvas, laphist[0], laphist[1], laphist[2], 0, threshold, totalLine, histogram);
    drawBinarize(srcCanvas, dstCanvas, params_w, sync);
}

const worker = new workerProcess("worker/binarize.js");

function drawBinarize(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
}
