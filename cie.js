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
    const onCIEXYZdata = function(name, arr, isDefault) {
	params[name] = arr;
	if (isDefault) {
	    params['cieArr'] = arr;
	    drawSpectrumGraph(graphCanvas, params, params.graphAlpha);
	    drawDiagram(diagramBaseCanvas, dstCanvas, params, true);
	}
    }
    bindFunction({"cie":null},
		 function(target, rel) {
                     const { cie } = params;
		     if (cie === "ciexyz31") {
			 params['cieArr'] = params['cie31Arr'];
		     } else if (cie === "ciexyz64") {
			 params['cieArr'] = params['cie64Arr'];
		     } else { // "ciexyzjv"
			 params['cieArr'] = params['cieJVArr'];
		     }
		     drawSpectrumGraph(graphCanvas, params, params.graphAlpha);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 }, params);
    bindFunction({"maxWidthHeight":"maxWidthHeightText"},
		 function(target, rel) {
		     drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
		     params['hist'] = getColorHistogram(srcCanvas);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 }, params);
    bindFunction({"chromaticity":null,
		  "pointSize":"pointSizeText",
                  "pointDensity":"pointDensityText",
		  "colorspace":null,
		  "tristimulus":null,
		  "guide":null,
                  "graphAlpha":"graphAlphaText",
		  },
		 function(target, rel) {
		     drawSpectrumGraph(graphCanvas, params, params.graphAlpha);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 }, params);
    //
    dropFunction(document, function(dataURL) {
	// console.debug("file drop");
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
	    params['hist'] = getColorHistogram(srcCanvas);
	    drawDiagram(diagramBaseCanvas, dstCanvas, params, true);
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
