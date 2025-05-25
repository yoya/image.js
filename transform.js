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
            let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    affinMatrix = makeAffinMatrix(srcCanvas, params);
	    setTableValues("affinMatrixTable", affinMatrix);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "rotateRoundCenterCheckbox":null,
                  "axisGuideCheckbox":null,
		  "rotateRange":"rotateText",
		  "transXRange":"transXText",
		  "transYRange":"transYText",
		  "outfillSelect":null},
		 function(target, rel) {
		     // console.debug("bindFunction:", target.id, rel);
                     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     affinMatrix = makeAffinMatrix(srcCanvas, params);
		     setTableValues("affinMatrixTable", affinMatrix);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params, rel);
		 }, params);
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, params);
    }, affinMatrix, affinWindow);
    bindCursolFunction("dstCanvas", params, function(target, eventType) {
        const p = params[target.id];
        const {x, y} = p;
        switch (eventType) {
        case "mousedown":
            p.dragging = true;
            p.prevX = x;
            p.prevY = y;
            break;
        case "mousemove":
            const {prevX, prevY} = p;
        case "mouseup":
        case "mouseleave":
             break;
         }
    }, params);
}

function makeAffinMatrix(canvas, params) {
    // console.debug("makeAffinMatrix",params);
    var width = canvas.width, height = canvas.height;
    var rotateRoundCenter = params["rotateRoundCenterCheckbox"];
    var rotate = params["rotateRange"];
    var transX = params["transXRange"];
    var transY = params["transYRange"];
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
	rotateRoundCenter: params["rotateRoundCenterCheckbox"],
        axisGuide        : params["axisGuideCheckbox"],
        outfill          : outfillStyleNumber(params["outfillSelect"]),
        dragging         : params["dstCanvas"].dragging,
        drag_x           : params["dstCanvas"].x,
        drag_y           : params["dstCanvas"].y,
    }
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
