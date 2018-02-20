"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var tristimulus_XYs_Table = {
    //http://flat-display-2.livedoor.biz/archives/50594042.html
    // https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space
    'srgb':    [[0.640, 0.330], [0.300, 0.600], [0.150, 0.060]],
    'dcip3':   [[0.680, 0.320], [0.265, 0.690], [0.150, 0.060]],
    'adobe':   [[0.640, 0.330], [0.210, 0.710], [0.150, 0.060]],
    'prophoto':[[0.7347, 0.2653], [0.1596, 0.8404], [0.0366, 0.0001]],
}


function main() {
    console.debug("cie main()");
    var srcCanvas = document.getElementById("srcCanvas");
    var diagramBaseCanvas = document.getElementById("diagramBaseCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var cieSelect = document.getElementById("cieSelect").value;
    var cieArr = null;
    var cie31Arr = null, cie64Arr = null, cieJVArr = null;
    var hist = null;
    var params = {};
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
			cie31Arr = arr;
			cieArr = cie31Arr;
			params = {
			    'cieArr'  :cieArr,
			    'cie31Arr':cie31Arr,
			    'hist'    :hist,
			    'sync'    :true
			};
			drawGraph(graphCanvas, params);
			drawDiagram(diagramBaseCanvas, dstCanvas, params);
		    } else if (cie === "64") {
			cie64Arr = arr;
		    } else { // "jv"
			cieJVArr = arr;
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
			 cieArr = cie31Arr;
		     } else if (cieSelect === "ciexyz64") {
			 cieArr = cie64Arr;
		     } else { // "ciexyzjv"
			 cieArr = cieJVArr;
		     }
		     params = {
			 'cieArr'  :cieArr,
			 'cie31Arr':cie31Arr,
			 'hist'    :hist,
			 'sync'    :rel
		     };
		     drawGraph(graphCanvas, params);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params);
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     hist = getColorHistogram(srcCanvas);
		     params = {
			 'cieArr':cieArr,
			 'hist'  :hist,
			 'sync'  :rel
		     };
		     drawDiagram(diagramBaseCanvas, dstCanvas, params);
		 } );
    bindFunction({"chromaticitySelect":null,
		  "pointSizeRange":"pointSizeText",
		  "colorspaceSelect":null,
		  "tristimulusCheckbox":null,
		  "guideCheckbox":null,
		  },
		 function(target, rel) {
		     params = {
			 'cieArr'  :cieArr,
			 'cie31Arr':cie31Arr,
			 'hist'    :hist,
			 'sync'    :rel
		     };
		     drawGraph(graphCanvas, params);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params);
		 } );
    //
    dropFunction(document, function(dataURL) {
	console.debug("file drop");
	srcImage = new Image();
	srcImage.onload = function() {
	    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    hist = getColorHistogram(srcCanvas);
	    params = {
		'cieArr':cieArr,
		'hist'  :hist,
		'sync'  :true
	    };
	    drawDiagram(diagramBaseCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    loadCIEXYZdata();
}

var worker = new workerProcess("worker/cie.js");
