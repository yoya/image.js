"use strict";
/*
 * 2017/06/26- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var params = {};
    var structureType = document.getElementById("structureTypeSelect").value;
    var filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
    //
    var structureTable = makeStructureTable(structureType, filterWindow);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstCanvas.width  = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawMorphologyFilter(srcCanvas, dstCanvas, structureTable, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"filterSelect":null},
		 function(target, rel) {
		     drawMorphologyFilter(srcCanvas, dstCanvas, structureTable, params, rel);
		 }, params);
    bindFunction({"structureTypeSelect":null,
		  "filterWindowRange":"filterWindowText"},
		 function(target, rel) {
		     structureType = params["structureTypeSelect"];
		     filterWindow  = params["filterWindowRange"];
		     structureTable = makeStructureTable(structureType, filterWindow);
		     drawMorphologyFilter(srcCanvas, dstCanvas, structureTable, params, rel);
		     bindTableFunction("structureTable", function(table, values, width) {
			 // console.debug(values, width);
			 structureTable = values;
			 drawMorphologyFilter(srcCanvas, dstCanvas, structureTable, params, true);
		     }, structureTable, filterWindow, "checkbox");
		 }, params);
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width  = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawMorphologyFilter(srcCanvas, dstCanvas, structureTable, params, rel);

		 }, params);
    bindTableFunction("structureTable", function(table, values, width) {
	// console.debug(values, width);
	structureTable = values;
	drawMorphologyFilter(srcCanvas, dstCanvas, structureTable, params);
    }, structureTable, filterWindow, "checkbox");
}

function makeStructureTable(structureType, filterWindow) {
    var structureTable = new Uint8Array(filterWindow * filterWindow);
    var i = 0;
    switch(structureType) {
    case "square":
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		structureTable[i] = 1;
		i++;
	    }
	}
	break;
    case "circle":
	var center = Math.floor(filterWindow/2);
	var radius = center + 0.25;
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		var dx = x - center, dy = y - center;
		if ((dx*dx + dy*dy) <=  radius*radius) {
		    structureTable[i] = 1;
		}
		i++;
	    }
	}
	break;
    case "diamond":
	var center = Math.floor(filterWindow/2);
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		var adx = Math.abs(x - center);
		var ady = Math.abs(y - center);
		if ((adx + ady) <=  center) {
		    structureTable[i] = 1;
		}
		i++;
	    }
	}
	break;
    case "cross":
	var center = Math.floor(filterWindow/2);
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		if ((x === center) || (y === center)) {
		    structureTable[i] = 1;
		}
		i++;
	    }
	}
	break;
    case "horizontal":
	var center = Math.floor(filterWindow/2);
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		if (y === center) {
		    structureTable[i] = 1;
		}
		i++;
	    }
	}
	break;
    case "vertical":
	var center = Math.floor(filterWindow/2);
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		if (x === center) {
		    structureTable[i] = 1;
		}
		i++;
	    }
	}
	break;
    }
    return structureTable;
}   

var worker = new workerProcess("worker/morphology.js");

function drawMorphologyFilter(srcCanvas, dstCanvas, structureTable, params, sync) {
    var params_w = {
        structureTable:structureTable,
        filter      : params["filterSelect"],
        filterWindow: params["filterWindowRange"],
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
