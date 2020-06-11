"use strict";
/*
 * 2017/06/23- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var gravityTable = document.getElementById("gravityTable");
    var gravity = 5; // center
    var params = {};
    //
    var drawImageAndGravity = function(rel) {
	var maxWidthHeight = params["maxWidthHeightRange"];
	drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	let dstWidth  = srcCanvas.width;
	let dstHeight = srcCanvas.height;
        // console.debug("dstWidth, dstHeight", dstWidth, dstHeight);
	document.getElementById("dstWidthRange").value = dstWidth;
	document.getElementById("dstWidthText").value  = dstWidth;
	document.getElementById("dstHeightRange").value = dstHeight;
	document.getElementById("dstHeightText").value  = dstHeight;
        params["dstWidthRange"]  = params["dstWidthText"]  = dstWidth;
        params["dstHeightRange"] = params["dstHeightText"] = dstHeight;
	drawGravity(srcCanvas, dstCanvas, params, rel);
    }
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = drawImageAndGravity;
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     drawImageAndGravity(rel);
		 }, params);
    bindFunction({"dstWidthRange":"dstWidthText",
		  "dstHeightRange":"dstHeightText",
		  "outfillSelect":null},
		 function(target, rel) {
		     drawGravity(srcCanvas, dstCanvas, params, rel);
		 }, params);
    var gravityTable = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    gravityTable[gravity-1] = 1;
    bindTableFunction("gravityTable", function(table, values, width) {
	// console.debug(values, width);
	for (gravity = 1; gravity <= width*width ; gravity++) {
	    if (values[gravity-1]) { // 1 origin;
		break;
	    }
	}
        params['gravity'] = gravity;
	// console.debug(gravity);
	drawGravity(srcCanvas, dstCanvas, params, true);
    }, gravityTable, 3, "radio");
    //
    params['gravity'] = gravity;
}

var worker = new workerProcess("worker/gravity.js");

function drawGravity(srcCanvas, dstCanvas, params, sync) {
    // console.debug("drawGravity", params);
    var params_w = {
        gravity  : params["gravity"],
        dstWidth : params["dstWidthRange"],
        dstHeight: params["dstHeightRange"],
	outfill  : outfillStyleNumber(params["outfillSelect"]),
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
