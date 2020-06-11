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
    var params = {};
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
                     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, rel);
		 }, params);
    bindFunction({"affinSelect":null, "outfillSelect":null},
		 function(target, rel) {
		     let affin = params["affinSelect"];
		     affinMatrix = affin2Matrix(affin, srcCanvas);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, rel);
		     setTableValues("affinMatrixTable", affinMatrix);
		 }, params);
    //
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, true);
    }, affinMatrix, affinWindow);
    //
    affin = params["affinSelect"];
    affinMatrix = affin2Matrix(affin, srcCanvas);
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

var worker = new workerProcess("worker/affintrans.js");

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, sync) {
    var params_w = {
        affinMatrix: affinMatrix,
        outfill    : outfillStyleNumber(params["outfillSelect"]),
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
