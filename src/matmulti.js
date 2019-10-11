'use strict';
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function extentMatrix(matrix, currentWindow, newWindow, newHeight) {
    const currentSize = matrix.length;
    const currentHeight = currentSize / currentWindow;
    const newSize = newWindow * newHeight;
    const newMatrix = [];
    for (let y = 0; y < newSize / newWindow; y++) {
	for (let x = 0; x < newWindow; x++) {
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
    const srcMatrix1Table = document.getElementById('srcMatrix1Table');
    const srcMatrix2Table = document.getElementById('srcMatrix2Table');
    const dstMatrixTable = document.getElementById('dstMatrixTable');
    const srcMatrixWindow0UpButton = document.getElementById('srcMatrixWindow0UpButton');
    const srcMatrixWindow0Text = document.getElementById('srcMatrixWindow0Text');
    const srcMatrixWindow0DownButton = document.getElementById('srcMatrixWindow0DownButton');
    const srcMatrixWindow1UpButton = document.getElementById('srcMatrixWindow1UpButton');
    const srcMatrixWindow1Text = document.getElementById('srcMatrixWindow1Text');
    const srcMatrixWindow1DownButton = document.getElementById('srcMatrixWindow1DownButton');
    const srcMatrixWindow2UpButton = document.getElementById('srcMatrixWindow2UpButton');
    const srcMatrixWindow2Text = document.getElementById('srcMatrixWindow2Text');
    const srcMatrixWindow2DownButton = document.getElementById('srcMatrixWindow2DownButton');

    let srcMatrix1 = [1, 0, 0,
		      0, 1, 0,
		      0, 0, 1];
    let srcMatrix1Window = 3;
    let srcMatrix2 = [1, 0, 0,
		      0, 1, 0,
		      0, 0, 1];
    let srcMatrix2Window = 3;
    const dstMatrix = [1, 0, 0,
		     0, 1, 0,
		     0, 0, 1];
    const dstMatrixWindow = 3;
    bindTableFunction('srcMatrix1Table', function(table, values, width) {
	srcMatrix1 = getTableValues(table.id);
	updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    }, srcMatrix1, srcMatrix1Window);
    bindTableFunction('srcMatrix2Table', function(table, values, width) {
	srcMatrix2 = getTableValues(table.id);
	updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    }, srcMatrix2, srcMatrix2Window);
    updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    bindFunction({
 'srcMatrixWindow0DownButton':null,
		   'srcMatrixWindow0UpButton':null,
		   'srcMatrixWindow0Text':null
},
		 function(target, rel) {
		     const id = target.id;
		     const currentWindow0 = srcMatrix1.length / srcMatrix1Window;
		     let newWindow0 = currentWindow0;
		     if (id === 'srcMatrixWindow0DownButton') {
			 newWindow0--;
		     } else if (id === 'srcMatrixWindow0UpButton') {
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
			 bindTableFunction('srcMatrix1Table', function(table, values, width) {
			     srcMatrix1 = getTableValues(table.id);
			     updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
			 }, srcMatrix1, srcMatrix1Window);
			 updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
		     }
		 });
    bindFunction({
 'srcMatrixWindow1DownButton':null,
		   'srcMatrixWindow1UpButton':null,
		   'srcMatrixWindow1Text':null
},
		 function(target, rel) {
		     const id = target.id;
		     const currentWindow1 = srcMatrix1Window;
		     let newWindow1 = currentWindow1;
		     if (id === 'srcMatrixWindow1DownButton') {
			 newWindow1--;
		     } else if (id === 'srcMatrixWindow1UpButton') {
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
			 bindTableFunction('srcMatrix1Table', function(table, values, width) {
			     srcMatrix1 = getTableValues(table.id);
			     updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
			 }, srcMatrix1, srcMatrix1Window);
			 bindTableFunction('srcMatrix2Table', function(table, values, width) {
			     srcMatrix2 = getTableValues(table.id);
			     updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
			 }, srcMatrix2, srcMatrix2Window);
			 updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
		     }
		 });
    bindFunction({
 'srcMatrixWindow2DownButton':null,
		   'srcMatrixWindow2UpButton':null,
		   'srcMatrixWindow2Text':null
},
		 function(target, rel) {
		     const id = target.id;
		     const currentWindow2 = srcMatrix2Window;
		     let newWindow2 = currentWindow2;
		     if (id === 'srcMatrixWindow2DownButton') {
			 newWindow2--;
		     } else if (id === 'srcMatrixWindow2UpButton') {
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
			 bindTableFunction('srcMatrix2Table', function(table, values, width) {
			     srcMatrix2 = getTableValues(table.id);
			     updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
			 }, srcMatrix2, srcMatrix2Window);
			 updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
		     }
		 });
}

function matrixMultiply(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window) {
    const src1Height = srcMatrix1.length / srcMatrix1Window;
    const src2Height = srcMatrix2.length / srcMatrix2Window;
    if (srcMatrix1Window !== src2Height) {
	console.error('srcMatrix1Window:', srcMatrix1Window, '!== src2Height:', src2Height);
	return null;
    }
    const dstMatrix = [];
    const dstWidth = srcMatrix2Window;
    const dstHeight = src1Height;
    for (let dstY = 0; dstY < dstHeight; dstY++) {
	for (let dstX = 0; dstX < dstWidth; dstX++) {
	    let dstV = 0;
	    for (let i = 0; i < src2Height; i++) {
		const srcX1 = i; const srcY1 = dstY;
		const srcX2 = dstX; const srcY2 = i;
		const srcV1 = srcMatrix1[srcX1 + srcY1 * srcMatrix1Window];
		const srcV2 = srcMatrix2[srcX2 + srcY2 * srcMatrix2Window];
		dstV += srcV1 * srcV2;
	    }
	    dstMatrix.push(dstV);
	}
    }
    return dstMatrix;
}

function updateDstMatrix(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window) {
    const dstMatrix = matrixMultiply(srcMatrix1, srcMatrix1Window, srcMatrix2, srcMatrix2Window);
    const dstMatrixWindow = srcMatrix2Window;
    bindTableFunction('dstMatrixTable', function(table, values, width) {
	setTableValues(table.id, dstMatrix); // constrain values
    }, dstMatrix, dstMatrixWindow);
}
