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
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var filter = document.getElementById("filterSelect").value;
    var structureType = document.getElementById("structureTypeSelect").value;
    var filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
    var structureTable = makeStructureTable(structureType, filterWindow);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"filterSelect":null},
		 function() {
		     filter = document.getElementById("filterSelect").value;
		     drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow);
		 });
    bindFunction({"structureTypeSelect":null,
		  "filterWindowRange":"filterWindowText"},
		 function() {
		     structureType = document.getElementById("structureTypeSelect").value;
		     filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
		     structureTable = makeStructureTable(structureType, filterWindow);
		     drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow);
		     bindTableFunction("structureTable", function(table, values, width) {
			 // console.debug(values, width);
			 structureTable = values;
			 filterWindow = width;
			 drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow);
		     }, structureTable, filterWindow, "checkbox");
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow);

		 } );
    bindTableFunction("structureTable", function(table, values, width) {
	// console.debug(values, width);
	structureTable = values;
	filterWindow = width;
	drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow);
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
    case "circle":
	var center = Math.floor(filterWindow/2);
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		var dx = x - center, dy = y - center;
		if ((dx*dx + dy*dy) <=  center*center) {
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
    }
    return structureTable;
}   

var worker = null;

function drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow) {
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = srcWidth, dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    if (worker) {
        worker.terminate();
    }
    var div = loadingStart();
    worker = new Worker("worker/morphology.js");
    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth = dstImageData.width;
        var dstHeight = dstImageData.height;
	dstCanvas.width  = dstWidth;
        dstCanvas.height = dstHeight;
        dstCtx.putImageData(dstImageData, 0, 0, 0, 0, dstWidth, dstHeight);
	loadingEnd(div);
        worker = null;
    }
    worker.postMessage({image:srcImageData, filter:filter,
			structureTable:structureTable,
			filterWindow:filterWindow},
                       [srcImageData.data.buffer]);
}
