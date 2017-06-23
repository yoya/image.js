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
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var gravityTable = document.getElementById("gravityTable");
    var gravity = 5; // center
    var dstWidth = parseFloat(document.getElementById("dstWidthRange").value);
    var dstHeight = parseFloat(document.getElementById("dstHeightRange").value);
    var outfill = document.getElementById("outfillSelect").value;
    outfill = outfillStyleNumber(outfill);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstWidth  = srcCanvas.width;
	    dstHeight = srcCanvas.height;
	    document.getElementById("dstWidthRange").value = dstWidth;
	    document.getElementById("dstWidthText").value  = dstWidth;
	    document.getElementById("dstHeightRange").value = dstHeight;
	    document.getElementById("dstHeightText").value  = dstHeight;
	    drawResize(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawResize(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill);
		 } );
    bindFunction({"dstWidthRange":"dstWidthText",
		  "dstHeightRange":"dstHeightText",
		  "outfillSelect":null},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     dstWidth = parseFloat(document.getElementById("dstWidthRange").value);
		     dstHeight = parseFloat(document.getElementById("dstHeightRange").value);
		     outfill = document.getElementById("outfillSelect").value;
		     outfill = outfillStyleNumber(outfill);
		     drawResize(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill);
		 } );
    var gravityTable = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    gravityTable[gravity-1] = 1;
    bindTableFunction("gravityTable", function(table, values, width) {
	// console.debug(values, width);
	for (gravity = 1; gravity <= width*width ; gravity++) {
	    if (values[gravity-1]) { // 1 origin;
		break;
	    }
	}
	// console.debug(gravity);
	drawResize(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill);
    }, gravityTable, 3, "radio");
}

function gravityLayout(srcSize, dstSize, gravity) {
    // console.debug("gravityLayout:",srcSize, dstSize, gravity);
    if (gravity == 0) { // left or top
	return 0;
    } else if (gravity === 1) { // center
	return Math.floor((dstSize - srcSize) / 2);
    } else { // right or buttom
	return dstSize - srcSize;
    }
}

function drawResize(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill) {
    // console.debug("drawResize");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var offsetX = gravityLayout(srcWidth, dstWidth, (gravity-1)%3);
    var offsetY = gravityLayout(srcHeight, dstHeight, Math.floor((gravity-1)/3));
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX - offsetX;
	    var srcY = dstY - offsetY;
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
