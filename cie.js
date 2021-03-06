"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    console.debug("cie main()");
    var srcCanvas = document.getElementById("srcCanvas");
    var diagramBaseCanvas = document.getElementById("diagramBaseCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var cieSelect = document.getElementById("cieSelect").value;
    var graphAlpha = parseFloat(document.getElementById("graphAlphaRange").value);
    var params = {
	'chromaticity':document.getElementById("chromaticitySelect").value,
	'pointSize':parseFloat(document.getElementById("pointSizeRange").value),
        'pointDensity':parseFloat(document.getElementById("pointDensityRange").value),
	'colorspace':document.getElementById("colorspaceSelect").value,
	'tristimulus':document.getElementById("tristimulusCheckbox").checked,
	'guide':document.getElementById("guideCheckbox").checked,
        'xMin':400, 'xMax':700,
    };
    var onCIEXYZdata = function(name, arr, isDefault) {
	params[name] = arr;
	if (isDefault) {
	    params['cieArr'] = arr;
	    drawSpectrumGraph(graphCanvas, params, graphAlpha);
	    drawDiagram(diagramBaseCanvas, dstCanvas, params, true);
	}
    }
    bindFunction({"cieSelect":null},
		 function(target, rel) {
		     console.debug("cieSelect event");
		     cieSelect = document.getElementById("cieSelect").value;
		     if (cieSelect === "ciexyz31") {
			 params['cieArr'] = params['cie31Arr'];
		     } else if (cieSelect === "ciexyz64") {
			 params['cieArr'] = params['cie64Arr'];
		     } else { // "ciexyzjv"
			 params['cieArr'] = params['cieJVArr'];
		     }
		     drawSpectrumGraph(graphCanvas, params, graphAlpha);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     params['hist'] = getColorHistogram(srcCanvas);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 } );
    bindFunction({"chromaticitySelect":null,
		  "pointSizeRange":"pointSizeText",
                  "pointDensityRange":"pointDensityText",
		  "colorspaceSelect":null,
		  "tristimulusCheckbox":null,
		  "guideCheckbox":null,
                  "graphAlphaRange":"graphAlphaText",
		  },
		 function(target, rel) {
		     params['chromaticity'] = document.getElementById("chromaticitySelect").value;
		     params['pointSize'] = parseFloat(document.getElementById("pointSizeRange").value);
                     params['pointDensity'] = parseFloat(document.getElementById("pointDensityRange").value);
		     params['colorspace'] = document.getElementById("colorspaceSelect").value;
		     params['tristimulus'] = document.getElementById("tristimulusCheckbox").checked;
		     params['guide'] = document.getElementById("guideCheckbox").checked;
                     graphAlpha = parseFloat(document.getElementById("graphAlphaRange").value);
		     drawSpectrumGraph(graphCanvas, params, graphAlpha);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 } );
    //
    dropFunction(document, function(dataURL) {
	console.debug("file drop");
	srcImage = new Image();
	srcImage.onload = function() {
	    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    params['hist'] = getColorHistogram(srcCanvas);
	    drawDiagram(diagramBaseCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    loadCIEXYZdata(onCIEXYZdata);
}

var worker = new workerProcess("worker/cie.js");

function drawDiagram(diagramBaseCanvas, dstCanvas, params, sync) {
    var hist = params['hist'];
    drawDiagramBase(diagramBaseCanvas, params);
    if (hist === null) {
	copyCanvas(diagramBaseCanvas, dstCanvas);
    } else {
	var diagramBaseCtx = diagramBaseCanvas.getContext("2d");
	var diagramBaseImageData = diagramBaseCtx.getImageData(0, 0, diagramBaseCanvas.width, diagramBaseCanvas.height);
	params['diagramBaseImageData'] = diagramBaseImageData;
	worker.process(srcCanvas, dstCanvas, params, sync);
    }
}
