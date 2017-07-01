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
    var outfill = document.getElementById("outfillSelect").value;
    outfill = outfillStyleNumber(outfill);
    var affinMatrix = affin2Matrix(affin, srcCanvas);
    var affinWindow = 3;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    affinMatrix = affin2Matrix(affin, srcCanvas);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     affinMatrix = affin2Matrix(affin, srcCanvas);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill);
		 } );
    bindFunction({"affinSelect":null, "outfillSelect":null},
		 function() {
		     affin = document.getElementById("affinSelect").value;
		     outfill = document.getElementById("outfillSelect").value;
		     outfill = outfillStyleNumber(outfill);
		     affinMatrix = affin2Matrix(affin, srcCanvas);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill);
		     setTableValues("affinMatrixTable", affinMatrix);
		 } );
    //
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill);
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
    case "skew0.2x":
	mat = [1, 0.2, 0,
	       0, 1,   0,
	       0, 0,   1];
	break;
    case "skew0.2y":
	mat = [1,   0, 0,
	       0.2, 1, 0,
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

var worker = null;

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill) {
    // console.debug("drawAffinTransform");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    if (worker) {
	worker.terminate();
    }
    var div = loadingStart();
    worker = new Worker("worker/affintrans.js");
    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth = dstImageData.width;
	var dstHeight = dstImageData.height;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	dstCtx.putImageData(dstImageData, 0, 0);
	loadingEnd(div);
    }
    worker.postMessage({image:srcImageData,
			affinMatrix:affinMatrix, outfill:outfill},
                       [srcImageData.data.buffer]);
}
