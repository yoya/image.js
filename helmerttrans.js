"use strict";
/*
 * 2024/04/13- (c) yoya@awm.jp
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
    var helmertMatrixTable = document.getElementById("helmertMatrixTable");
    var helmert = document.getElementById("helmertSelect").value;
    var helmertMatrix = helmert2Matrix(helmert, srcCanvas);
    var helmertWindow = 3;
    var params = {};
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawHelmertTransform(srcCanvas, dstCanvas, helmertMatrix, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
                     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawHelmertTransform(srcCanvas, dstCanvas, helmertMatrix, params, rel);
		 }, params);
    bindFunction({"helmertSelect":null, "outfillSelect":null},
		 function(target, rel) {
		     let helmert = params["helmertSelect"];
		     helmertMatrix = helmert2Matrix(helmert, srcCanvas);
		     drawHelmertTransform(srcCanvas, dstCanvas, helmertMatrix, params, rel);
		     setTableValues("helmertMatrixTable", helmertMatrix);
		 }, params);
    //
    bindTableFunction("helmertMatrixTable", function(table, values, width) {
        for (const idx in helmertMatrix) {
            if (helmertMatrix[idx] != values[idx]) {
                // mapping: { 0:4, 1:3, 3:1, 4:0 }
                // | 0 1 2 |
                // | 3 4 5 |
                if (idx == 0 || idx == 4) {
                    values[4 - idx] = values[idx];
                } else if (idx == 1 || idx == 3) {
                    values[4 - idx] = - values[idx];
                }
            }
        }
	helmertMatrix = values;
        setTableValues("helmertMatrixTable", helmertMatrix);
	drawHelmertTransform(srcCanvas, dstCanvas, helmertMatrix, params, true);
    }, helmertMatrix, helmertWindow);
    //
    helmert = params["helmertSelect"];
    helmertMatrix = helmert2Matrix(helmert, srcCanvas);
}

function helmert2Matrix(helmert, canvas) {
    var mat = null;
    switch (helmert) {
    case "ident":
	mat = [1, 0, 0,
	       0, 1, 0];
	break;
    case "scale2":
	mat = [2, 0, 0,
	       0, 2, 0];
	break;
    case "scale0.5":
	mat = [0.5, 0, 0,
	       0, 0.5, 0];
	break;
    case "rotate45":
	var theta = Math.PI / 4;
	mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), 0];
	mat[2] = - mat[1] * canvas.height; // minX
	break;
    case "rotate90":
	var theta = Math.PI / 2;
	mat = [Math.cos(theta), -Math.sin(theta), canvas.height,
	       Math.sin(theta),  Math.cos(theta), 0];
	break;
    case "rotate180":
	var theta = Math.PI / 2 * 2;
	mat = [Math.cos(theta), -Math.sin(theta), canvas.width,
	       Math.sin(theta),  Math.cos(theta), canvas.height];
	break;
    case "rotate270":
	var theta = Math.PI / 2 * 3;
	mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), canvas.width];
	break;
    default:
	console.error("Invalid helmert:"+helmert);
	break;
    }
    return mat;
	
};

var worker = new workerProcess("worker/helmerttrans.js");

function drawHelmertTransform(srcCanvas, dstCanvas, helmertMatrix, params, sync) {
    var params_w = {
        helmertMatrix: helmertMatrix,
        outfill    : outfillStyleNumber(params["outfillSelect"]),
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
