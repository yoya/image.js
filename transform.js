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
    var affinMatrix = [1, 0, 0,
		       0, 1, 0,
		       0, 0, 1];
    var affinWindow = 3;
    var params = {};
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            let maxWidthHeight = params.maxWidthHeight;
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    affinMatrix = makeAffinMatrix(srcCanvas, params);
	    setTableValues("affinMatrixTable", affinMatrix);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindParams(params, function(key, target, rel) {
		     // console.debug("bindParams:", key, rel);
                     let maxWidthHeight = params.maxWidthHeight;
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     affinMatrix = makeAffinMatrix(srcCanvas, params);
		     setTableValues("affinMatrixTable", affinMatrix);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, rel);
		 }, {keys: ["maxWidthHeight", "rotateRoundCenter", "axisGuide", "rotate", "transX", "transY", "outfill"]});
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params);
    }, affinMatrix, affinWindow);
}

function makeAffinMatrix(canvas, params) {
    // console.debug("makeAffinMatrix",params);
    var width = canvas.width, height = canvas.height;
    var rotateRoundCenter = params.rotateRoundCenter;
    var rotate = params.rotate;
    var transX = params.transX;
    var transY = params.transY;
    var theta = 2 * Math.PI * rotate / 360;
    var mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
    var leftX, topY;
    mat[2] = transX * width;
    mat[5] = transY * height;
    if (rotateRoundCenter) {
	var hypotenuse = Math.sqrt(width*width + height*height);
	mat[2] += (- mat[0] * width - mat[1] * height + hypotenuse) / 2;
	mat[5] += (- mat[3] * width - mat[4] * height + hypotenuse) / 2;
    }
    return mat;
};

var worker = new workerProcess("worker/transform.js");

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, sync) {
    // console.debug("drawAffinTransform", affinMatrix, params);
    var params_w = {
        affinMatrix      : affinMatrix,
	rotateRoundCenter: params.rotateRoundCenter,
        axisGuide        : params.axisGuide,
        outfill          : outfillStyleNumber(params.outfill),
    }
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
