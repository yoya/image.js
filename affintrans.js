"use strict";
/*
 * 2017/04/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var affinMatrixTable = document.getElementById("affinMatrixTable");
    var affin = document.getElementById("affinSelect").value;
    var affinMatrix = affin2Matrix(affin, srcCanvas);
    var affinWindow = 3;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndAffinTransform(srcImage, srcCanvas, dstCanvas, affinMatrix);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndAffinTransform(srcImage, srcCanvas, dstCanvas, affinMatrix);
		 } );
    bindFunction({"affinSelect":null},
		 function() {
		     affin = document.getElementById("affinSelect").value;
		     affinMatrix = affin2Matrix(affin, srcCanvas);
		     drawSrcImageAndAffinTransform(srcImage, srcCanvas, dstCanvas, affinMatrix);
		     setTableValues("affinMatrixTable", affinMatrix);
		 } );
    //
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawSrcImageAndAffinTransform(srcImage, srcCanvas, dstCanvas, affinMatrix);
    }, affinMatrix, affinWindow);
}

function affin2Matrix(affin, canvas) {
    var mat = null;
    switch (affin) {
    case "ident":
	mat = [1, 0, 0,
	       0, 1, 0,
	       0, 0, 1];
	break;
    case "scale2":
	mat = [2, 0, 0,
	       0, 2, 0,
	       0, 0, 1];
	break;
    case "scale0.5":
	mat = [0.5, 0, 0,
	       0, 0.5, 0,
	       0,   0, 1];
	break;
    case "flop":
	mat = [-1, 0, canvas.width,
	       0,  1, 0,
	       0,  0, 1];
	break;
    case "flip":
	mat = [1,  0, 0,
	       0, -1, canvas.height,
	       0,  0, 1];
	break;
    case "flipflop":
	mat = [-1, 0, canvas.width,
	       0, -1, canvas.height,
	       0,  0, 1];
	break;
    case "rotate45":
	var theta = Math.PI / 4;
	mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
	mat[2] = - mat[1] * canvas.height; // minX
	break;
    case "rotate90":
	var theta = Math.PI / 2;
	mat = [Math.cos(theta), -Math.sin(theta), canvas.height,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
	break;
    case "rotate180":
	var theta = Math.PI / 2 * 2;
	mat = [Math.cos(theta), -Math.sin(theta), canvas.width,
	       Math.sin(theta),  Math.cos(theta), canvas.height,
	       0, 0, 1];
	break;
    case "rotate270":
	var theta = Math.PI / 2 * 3;
	mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), canvas.width,
	       0, 0, 1];
	break;
    default:
	console.error("Invalid affin:"+affin);
	break;
    }
    return mat;
	
};

function drawSrcImageAndAffinTransform(srcImage, srcCanvas, dstCancas, affinMatrix) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix);
}

function affinTransform(srcX, srcY, mat) {
    var dstX = srcX*mat[0] + srcY*mat[1] + mat[2];
    var dstY = srcX*mat[3] + srcY*mat[4] + mat[5];
    return [dstX, dstY];
}

// http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/tech23.html
function invertMatrix(mat, matWindow) {
    var invMat = null;
    switch(matWindow) {
    case 3:
	var [a11, a12, a13, a21, a22, a23, a31, a32, a33] = mat;
	var det = a11*a22*a33 + a21*a32*a13 + a31*a12*a23 - a11*a32*a23 - a31*a22*a13 - a21*a12*a33;
	invMat = [a22*a33-a23*a32, a13*a32-a12*a33, a12*a23-a13*a22,
		  a23*a31-a21*a33, a11*a33-a13*a31, a13*a21-a11*a23,
		  a21*a32-a22*a31, a12*a31-a11*a32, a11*a22-a12*a21];
	invMat = invMat.map(function(v) { return v/det; });
	break;
    default:
	console.error("Invalid matWindow:"+matWindow);
	break;
    }
    return invMat;
}

function scaleAffinTransform(x, y, width, height, mat) {
    var [dstX1, dstY1] = affinTransform(x, y, mat);
    var [dstX2, dstY2] = affinTransform(x+width, y, mat);
    var [dstX3, dstY3] = affinTransform(x, y+height, mat);
    var [dstX4, dstY4] = affinTransform(x+width, y+height, mat);
    var maxX = Math.max(dstX1, dstX2, dstX3, dstX4);
    var minX = Math.min(dstX1, dstX2, dstX3, dstX4);
    var maxY = Math.max(dstY1, dstY2, dstY3, dstY4);
    var minY = Math.min(dstY1, dstY2, dstY3, dstY4);
    return [maxX - minX, maxY - minY];
}


function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix) {
    // console.debug("drawAffinTransform");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var [dstWidth, dstHeight] = scaleAffinTransform(0, 0, srcWidth, srcHeight, affinMatrix);
    dstWidth >>>= 0; dstHeight >>>= 0;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    var invMat = invertMatrix(affinMatrix, 3);
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var [srcX, srcY] = affinTransform(dstX, dstY, invMat);
	    var rgba = getRGBA(srcImageData, srcX>>>0, srcY>>>0);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
