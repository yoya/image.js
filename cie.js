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
    var params = {
	'chromaticity':document.getElementById("chromaticitySelect").value,
	'pointSize':parseFloat(document.getElementById("pointSizeRange").value),
	'colorspace':document.getElementById("colorspaceSelect").value,
	'tristimulus':document.getElementById("tristimulusCheckbox").checked,
	'guide':document.getElementById("guideCheckbox").checked,
    };
    var loadCIEXYZdata = function() {
	var cieList = ["31", "64", "jv"];
	for (var i in cieList) {
	    var cie = cieList[i];
	    var file = null;
	    switch (cie) {
	    case "31":
		file = "data/ciexyz31.json";
		break;
	    case "64":
		file = "data/ciexyz64.json";
		break;
	    case "jv":
		file = "data/ciexyzjv.json";
		break;
	    }
	    var xhr = new XMLHttpRequest();
	    xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
		    var cie = this.cie;
		    var arr = JSON.parse(this.responseText);
		    var arr = arr.filter(function(e) {
			var lw =  e[0]; // length of wave
			return (370 < lw) && (lw < 720);
		    });
		    if (cie === "31") { // cieSelect as default
			params['cieArr'] = arr;
			params['cie31Arr'] = arr;
			drawGraph(graphCanvas, params, true);
			drawDiagram(diagramBaseCanvas, dstCanvas, params, true);
		    } else if (cie === "64") {
			params['cie64Arr'] = arr;
		    } else { // "jv"
			params['cieJVArr'] = arr;
		    }
		}
	    };
	    xhr.cie = cie;
	    xhr.open("GET", file, true); // async:true
	    xhr.send(null);
	    xhr = null;
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
		     drawGraph(graphCanvas, params, rel);
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
		  "colorspaceSelect":null,
		  "tristimulusCheckbox":null,
		  "guideCheckbox":null,
		  },
		 function(target, rel) {
		     params['chromaticity'] = document.getElementById("chromaticitySelect").value;
		     params['pointSize'] = parseFloat(document.getElementById("pointSizeRange").value);
		     params['colorspace'] = document.getElementById("colorspaceSelect").value;
		     params['tristimulus'] = document.getElementById("tristimulusCheckbox").checked;
		     params['guide'] = document.getElementById("guideCheckbox").checked;
		     drawGraph(graphCanvas, params, rel);
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
    loadCIEXYZdata();
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
