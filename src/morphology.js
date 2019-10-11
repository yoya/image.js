'use strict';
/*
 * 2017/06/26- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    let filter = document.getElementById('filterSelect').value;
    let structureType = document.getElementById('structureTypeSelect').value;
    let filterWindow = parseFloat(document.getElementById('filterWindowRange').value);
    let structureTable = makeStructureTable(structureType, filterWindow);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstCanvas.width  = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({ 'filterSelect':null },
		 function(target, rel) {
		     filter = document.getElementById('filterSelect').value;
		     drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow, rel);
		 });
    bindFunction({
 'structureTypeSelect':null,
		  'filterWindowRange':'filterWindowText'
},
		 function(target, rel) {
		     structureType = document.getElementById('structureTypeSelect').value;
		     filterWindow = parseFloat(document.getElementById('filterWindowRange').value);
		     structureTable = makeStructureTable(structureType, filterWindow);
		     drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow, rel);
		     bindTableFunction('structureTable', function(table, values, width) {
			 // console.debug(values, width);
			 structureTable = values;
			 filterWindow = width;
			 drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow, true);
		     }, structureTable, filterWindow, 'checkbox');
		 });
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width  = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow, rel);
		 });
    bindTableFunction('structureTable', function(table, values, width) {
	// console.debug(values, width);
	structureTable = values;
	filterWindow = width;
	drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow);
    }, structureTable, filterWindow, 'checkbox');
}

function makeStructureTable(structureType, filterWindow) {
    const structureTable = new Uint8Array(filterWindow * filterWindow);
    let i = 0;
    switch (structureType) {
    case 'square':
	for (var y = 0; y < filterWindow; y++) {
	    for (var x = 0; x < filterWindow; x++) {
		structureTable[i] = 1;
		i++;
	    }
	}
	break;
    case 'cross':
	var center = Math.floor(filterWindow / 2);
	for (var y = 0; y < filterWindow; y++) {
	    for (var x = 0; x < filterWindow; x++) {
		if ((x === center) || (y === center)) {
		    structureTable[i] = 1;
		}
		i++;
	    }
	}
	break;
    case 'circle':
	var center = Math.floor(filterWindow / 2);
	var radius = center + 0.25;
	for (var y = 0; y < filterWindow; y++) {
	    for (var x = 0; x < filterWindow; x++) {
		const dx = x - center; const dy = y - center;
		if ((dx * dx + dy * dy) <=  radius * radius) {
		    structureTable[i] = 1;
		}
		i++;
	    }
	}
	break;
    case 'diamond':
	var center = Math.floor(filterWindow / 2);
	for (var y = 0; y < filterWindow; y++) {
	    for (var x = 0; x < filterWindow; x++) {
		const adx = Math.abs(x - center);
		const ady = Math.abs(y - center);
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

const worker = new workerProcess('worker/morphology.js');

function drawMorphologyFilter(srcCanvas, dstCanvas, filter, structureTable, filterWindow, sync) {
    const params = { filter:filter, structureTable:structureTable, filterWindow:filterWindow };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
