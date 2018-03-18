"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function extentMatrix(matrix, currentWindow, newWindow, newSize) {
    var currentSize = matrix.length;
    var newMatrix = [];
    for (var y = 0 ; y < newSize / newWindow ; y++) {
	for (var x = 0 ; x < newWindow ; x++) {
	    if ((x < currentWindow) && (y < currentSize / currentWindow)) {
		newMatrix.push(matrix[x + y * currentWindow]);
	    } else {
		newMatrix.push(0);
	    }
	}
    }
    return newMatrix;
}

function main() {
    // console.debug("main");
    var srcMatrix1Table = document.getElementById("srcMatrix1Table");
    var srcMatrix2Table = document.getElementById("srcMatrix2Table");
    var dstMatrixTable = document.getElementById("dstMatrixTable");
    var srcMatrix1 = [1, 0, 0,
		      0, 1, 0,
		      0, 0, 1];
    var srcMatrix1Window = 3;
    var srcMatrix2 = [1, 0, 0,
		      0, 1, 0,
		      0, 0, 1];
    var srcMatrix2Window = 3;
    var dstMatrix = [1, 0, 0,
		     0, 1, 0,
		     0, 0, 1];
    var dstMatrixWindow = 3;
    bindTableFunction("srcMatrix1Table", function(table, values, width) {
	srcMatrix1 = getTableValues(table.id);
	updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    }, srcMatrix1, srcMatrix1Window);
    bindTableFunction("srcMatrix2Table", function(table, values, width) {
	srcMatrix2 = getTableValues(table.id);
	updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    }, srcMatrix2, srcMatrix2Window);
    updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
}

// 3x3 only
function matrixMultiply(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window) {
    var src1Height = srcMatrix1.length / srcMatrix1Window;
    var src2Height = srcMatrix2.length / srcMatrix2Window;
    if (srcMatrix1Window !== src2Height) {
	console.error("srcMatrix1Window:", srcMatrix1Window,"!== src2Height:", src2Height);
	return null;
    }
    var dstMatrix = [];
    var dstWidth = srcMatrix2Window;
    var dstHeight= srcMatrix1Window;
    for (var dstY = 0 ; dstY < dstHeight ; dstY++) {
	for (var dstX = 0 ; dstX < dstWidth ; dstX++) {
	    var dstV = 0;
	    for (var i = 0 ; i < dstHeight ; i++) {
		var srcX1 = i, srcY1 = dstY;
		var srcX2 = dstX, srcY2 = i;
		var srcV1 = srcMatrix1[srcX1 + srcY1 * srcMatrix1Window];
		var srcV2 = srcMatrix2[srcX2 + srcY2 * srcMatrix2Window];
		dstV += srcV1 * srcV2;
	    }
	    dstMatrix.push(dstV);
	}
    }
    return dstMatrix;
}

function updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window) {
    console.debug("updateDstMatrix(", srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    var dstMatrix = matrixMultiply(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    var dstMatrixWindow = srcMatrix2Window;
    console.log(dstMatrix, dstMatrixWindow);
    bindTableFunction("dstMatrixTable", function(table, values, width) {
	setTableValues(table.id, dstMatrix); // constrain values
    }, dstMatrix, dstMatrixWindow);
}
