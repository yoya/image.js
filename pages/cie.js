"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    //  console.debug("cie main()");
    const srcCanvas = document.getElementById("srcCanvas");
    const diagramBaseCanvas = document.getElementById("diagramBaseCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const params = {
        'xMin':400, 'xMax':700,
    };
    // the CIE XYZ data (cie31Arr, cie64Arr, cieJVArr) arrive asynchronously;
    // cieArr stays undefined until the selected one is loaded, and nothing
    // is drawn until then (controls may be used right after the page opens).
    const selectCieArr = function() {
	const { cie } = params;
	if (cie === "ciexyz64") {
	    params['cieArr'] = params['cie64Arr'];
	} else if (cie === "ciexyzjv") {
	    params['cieArr'] = params['cieJVArr'];
	} else { // "ciexyz31" (also the default before the controls are read)
	    params['cieArr'] = params['cie31Arr'];
	}
    }
    const drawAll = function(sync) {
	if (! params['cieArr']) {
	    return ;  // data not loaded yet; drawn again when it arrives
	}
	drawSpectrumGraph(graphCanvas, params, params.graphAlpha);
	drawDiagram(diagramBaseCanvas, dstCanvas, params, sync);
    }
    const onCIEXYZdata = function(name, arr, isDefault) {
	params[name] = arr;
	const prev = params['cieArr'];
	selectCieArr();
	if (params['cieArr'] !== prev) {  // the selected data has just arrived
	    drawAll(true);
	}
    }
    bindParams(params, function(key, target, rel) {
		     selectCieArr();
		     drawAll(rel);
		 }, {keys: ["cie"]});
    bindParams(params, function(key, target, rel) {
		     drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
		     params['hist'] = getColorHistogram(srcCanvas);
		     drawAll(rel);
		 }, {keys: ["maxWidthHeight"]});
    bindParams(params, function(key, target, rel) {
		     drawAll(rel);
		 }, {keys: ["chromaticity", "pointSize", "pointDensity", "colorspace", "tristimulus", "guide", "graphAlpha"]});
    //
    dropFunction(document, function(dataURL) {
	// console.debug("file drop");
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
	    params['hist'] = getColorHistogram(srcCanvas);
	    drawAll(true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    loadCIEXYZdata(onCIEXYZdata);
}

const worker = new workerProcess("worker/cie.js");

function drawDiagram(diagramBaseCanvas, dstCanvas, params, sync) {
    const { hist } = params;
    drawDiagramBase(diagramBaseCanvas, params);
    if (hist === null) {
	copyCanvas(diagramBaseCanvas, dstCanvas);
    } else {
	const options = { willReadFrequently: true };
	const diagramBaseCtx = diagramBaseCanvas.getContext("2d", options);
	const diagramBaseImageData = diagramBaseCtx.getImageData(0, 0, diagramBaseCanvas.width, diagramBaseCanvas.height);
	params['diagramBaseImageData'] = diagramBaseImageData;
	worker.process(srcCanvas, dstCanvas, params, sync);
    }
}
