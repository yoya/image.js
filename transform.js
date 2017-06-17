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
    var rotateAroundZero = document.getElementById("rotateAroundZeroCheckbox").checked;
    var outfill = document.getElementById("outfillSelect").value;
    outfill = outfillStyleNumber(outfill);
    var affinMatrix = [1, 0, 0,
		       0, 1, 0,
		       0, 0, 1];
    var affinWindow = 3;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    affinMatrix = makeAffinMatrix(srcCanvas, rotateAroundZero);
	    setTableValues("affinMatrixTable", affinMatrix);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "rotateAroundZeroCheckbox":null,
		  "rotateRange":"rotateText",
		  "transXRange":"transXText",
		  "transYRange":"transYText",
		  "outfillSelect":null},
		 function(target) {
		     console.debug("bindFunction:", target.id);
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     rotateAroundZero = document.getElementById("rotateAroundZeroCheckbox").checked;
		     outfill = document.getElementById("outfillSelect").value;
		     outfill = outfillStyleNumber(outfill);
		     affinMatrix = makeAffinMatrix(srcCanvas, rotateAroundZero);
		     setTableValues("affinMatrixTable", affinMatrix);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill);
		 } );
    //
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill);
    }, affinMatrix, affinWindow);
}

function makeAffinMatrix(canvas, rotateAroundZero) {
    var width = canvas.width, height = canvas.height;
    var rotate = parseFloat(document.getElementById("rotateRange").value);
    var transX = parseFloat(document.getElementById("transXRange").value);
    var transY = parseFloat(document.getElementById("transYRange").value);
    var theta = 2 * Math.PI * rotate / 360;
    var mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
    var leftX, topY;
    mat[2] = transX * width;
    mat[5] = transY * height;
    if (rotateAroundZero === false) {
	var hypotenuse = Math.sqrt(width*width + height*height);
	mat[2] += (- mat[0] * width - mat[1] * height + hypotenuse) / 2;
	mat[5] += (- mat[3] * width - mat[4] * height + hypotenuse) / 2;
    }
    return mat;
};

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

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill) {
    // console.debug("drawAffinTransform");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    if (rotateAroundZero) {
	var [dstWidth, dstHeight] = [srcWidth * 2 , srcHeight * 2];
    } else {
	var hypotenuse = Math.sqrt(srcWidth*srcWidth + srcHeight*srcHeight);
	var [dstWidth, dstHeight] = [hypotenuse, hypotenuse];
	dstWidth = Math.ceil(dstWidth); dstHeight = Math.ceil(dstHeight);
    }
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    var invMat = invertMatrix(affinMatrix, 3);
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX, srcY;
	    if (rotateAroundZero) {
		[srcX, srcY] = affinTransform(dstX - dstWidth / 2,
					      dstY - dstHeight / 2,
					      invMat);
	    } else {
		[srcX, srcY] = affinTransform(dstX, dstY, invMat);
	    }
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    if (rotateAroundZero) {
		if ((dstX == (dstWidth / 2)) || (dstY === (dstHeight / 2))) {
		    var [r, g, b, a] = rgba;
		    rgba = [r * a, g * a,  b * a, 255];
		}
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
