"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function extentMatrix(matrix, currentWindow, newWindow, newHeight) {
    var currentSize = matrix.length;
    var currentHeight = currentSize / currentWindow;
    var newSize = newWindow * newHeight;
    var newMatrix = [];
    for (var y = 0 ; y < newSize / newWindow ; y++) {
	for (var x = 0 ; x < newWindow ; x++) {
	    if ((x < currentWindow) && (y < currentHeight)) {
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
    var srcMatrixWindow0UpButton = document.getElementById("srcMatrixWindow0UpButton");
    var srcMatrixWindow0Text = document.getElementById("srcMatrixWindow0Text");
    var srcMatrixWindow0DownButton = document.getElementById("srcMatrixWindow0DownButton");
    var srcMatrixWindow1UpButton = document.getElementById("srcMatrixWindow1UpButton");
    var srcMatrixWindow1Text = document.getElementById("srcMatrixWindow1Text");
    var srcMatrixWindow1DownButton = document.getElementById("srcMatrixWindow1DownButton");
    var srcMatrixWindow2UpButton = document.getElementById("srcMatrixWindow2UpButton");
    var srcMatrixWindow2Text = document.getElementById("srcMatrixWindow2Text");
    var srcMatrixWindow2DownButton = document.getElementById("srcMatrixWindow2DownButton");

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
    bindFunction({ "srcMatrixWindow0DownButton":null,
		   "srcMatrixWindow0UpButton":null,
		   "srcMatrixWindow0Text":null },
		 function(target, rel) {
		     var id = target.id;
		     var currentWindow0 = srcMatrix1.length / srcMatrix1Window;
		     var newWindow0 = currentWindow0;
		     if (id === "srcMatrixWindow0DownButton") {
			 newWindow0--;
		     } else if (id === "srcMatrixWindow0UpButton") {
			 newWindow0++;
		     } else {
			 newWindow0 = parseFloat(srcMatrixWindow0Text.value);
		     }
		     if (newWindow0 < 1) {
			 newWindow0 = 1;
		     }
		     if (newWindow0 != currentWindow0) {
			 srcMatrixWindow0Text.value = newWindow0 | 0;
			 srcMatrix1 = extentMatrix(srcMatrix1, srcMatrix1Window, srcMatrix1Window, newWindow0);
			 bindTableFunction("srcMatrix1Table", function(table, values, width) {
			     srcMatrix1 = getTableValues(table.id);
			     updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
			 }, srcMatrix1, srcMatrix1Window);
			 updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
		     }

		 });
    bindFunction({ "srcMatrixWindow1DownButton":null,
		   "srcMatrixWindow1UpButton":null,
		   "srcMatrixWindow1Text":null },
		 function(target, rel) {
		     var id = target.id;
		     var currentWindow1 = srcMatrix1Window;
		     var newWindow1 = currentWindow1;
		     if (id === "srcMatrixWindow1DownButton") {
			 newWindow1--;
		     } else if (id === "srcMatrixWindow1UpButton") {
			 newWindow1++;
		     } else {
			 newWindow1 = parseFloat(srcMatrixWindow1Text.value);
		     }
		     if (newWindow1 < 1) {
			 newWindow1 = 1;
		     }
		     if (newWindow1 != currentWindow1) {
			 srcMatrixWindow1Text.value = newWindow1 | 0;
			 srcMatrix1 = extentMatrix(srcMatrix1, currentWindow1, newWindow1, srcMatrix1.length / currentWindow1);
			 srcMatrix1Window = newWindow1;
			 srcMatrix2 = extentMatrix(srcMatrix2, srcMatrix2Window, srcMatrix2Window, newWindow1);
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

		 });
    bindFunction({ "srcMatrixWindow2DownButton":null,
		   "srcMatrixWindow2UpButton":null,
		   "srcMatrixWindow2Text":null },
		 function(target, rel) {
		     var id = target.id;
		     var currentWindow2 = srcMatrix2Window;
		     var newWindow2 = currentWindow2;
		     if (id === "srcMatrixWindow2DownButton") {
			 newWindow2--;
		     } else if (id === "srcMatrixWindow2UpButton") {
			 newWindow2++;
		     } else {
			 newWindow2 = parseFloat(srcMatrixWindow2Text.value);
		     }
		     if (newWindow2 < 1) {
			 newWindow2 = 1;
		     }
		     if (newWindow2 != currentWindow2) {
			 srcMatrixWindow2Text.value = newWindow2 | 0;
			 srcMatrix2 = extentMatrix(srcMatrix2, srcMatrix2Window, newWindow2, srcMatrix2.length / currentWindow2);
			 srcMatrix2Window = newWindow2;
			 bindTableFunction("srcMatrix2Table", function(table, values, width) {
			     srcMatrix2 = getTableValues(table.id);
			     updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
			 }, srcMatrix2, srcMatrix2Window);
			 updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
		     }

		 });
}

function matrixMultiply(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window) {
    var src1Height = srcMatrix1.length / srcMatrix1Window;
    var src2Height = srcMatrix2.length / srcMatrix2Window;
    if (srcMatrix1Window !== src2Height) {
	console.error("srcMatrix1Window:", srcMatrix1Window,"!== src2Height:", src2Height);
	return null;
    }
    var dstMatrix = [];
    var dstWidth = srcMatrix2Window;
    var dstHeight= src1Height;
    for (var dstY = 0 ; dstY < dstHeight ; dstY++) {
	for (var dstX = 0 ; dstX < dstWidth ; dstX++) {
	    var dstV = 0;
	    for (var i = 0 ; i < src2Height ; i++) {
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
    var dstMatrix = matrixMultiply(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    var dstMatrixWindow = srcMatrix2Window;
    bindTableFunction("dstMatrixTable", function(table, values, width) {
	setTableValues(table.id, dstMatrix); // constrain values
    }, dstMatrix, dstMatrixWindow);
}
