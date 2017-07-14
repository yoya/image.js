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
    var rotateRoundCenter = document.getElementById("rotateRoundCenterCheckbox").checked;
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
	    affinMatrix = makeAffinMatrix(srcCanvas, rotateRoundCenter);
	    setTableValues("affinMatrixTable", affinMatrix);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "rotateRoundCenterCheckbox":null,
		  "rotateRange":"rotateText",
		  "transXRange":"transXText",
		  "transYRange":"transYText",
		  "outfillSelect":null},
		 function(target, rel) {
		     // console.debug("bindFunction:", target.id, rel);
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     rotateRoundCenter = document.getElementById("rotateRoundCenterCheckbox").checked;
		     outfill = document.getElementById("outfillSelect").value;
		     outfill = outfillStyleNumber(outfill);
		     affinMatrix = makeAffinMatrix(srcCanvas, rotateRoundCenter);
		     setTableValues("affinMatrixTable", affinMatrix);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill, rel);
		 } );
    //
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill);
    }, affinMatrix, affinWindow);
}

function makeAffinMatrix(canvas, rotateRoundCenter) {
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
    if (rotateRoundCenter) {
	var hypotenuse = Math.sqrt(width*width + height*height);
	mat[2] += (- mat[0] * width - mat[1] * height + hypotenuse) / 2;
	mat[5] += (- mat[3] * width - mat[4] * height + hypotenuse) / 2;
    }
    return mat;
};

var worker = new workerProcess("worker/transform.js");

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill, sync) {
    var params = {affinMatrix:affinMatrix,
		  rotateRoundCenter:rotateRoundCenter, outfill:outfill}
    worker.process(srcCanvas, dstCanvas, params, sync);
}
