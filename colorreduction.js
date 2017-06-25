"use strict";
/*
 * 2017/03/17- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorReduction(srcImage, srcCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "quantizeMethod":null},
		 function() {
		     drawSrcImageAndColorReduction(srcImage, srcCanvas);
		 } );
}

var worker = null;

function drawSrcImageAndColorReduction(srcImage, srcCanvas) {
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var quantizeMethod = document.getElementById("quantizeMethod").value;
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    document.getElementById("nColorSrc").value = "";
    document.getElementById("nColorDst").value = "";
    var srcImageData = srcCanvas.getContext("2d").getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var div = loadingStart();
    var srcImageData = srcCtx.getImageData(0, 0, srcCanvas.width,
					   srcCanvas.height);
    document.getElementById("nColorSrc").value = getColorNum(srcImageData);

    if (worker) {
	worker.terminate();
    }
    worker = new Worker("worker/colorreduction.js");
    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth = dstImageData.width;
	var dstHeight = dstImageData.height;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	dstCtx.putImageData(dstImageData, 0, 0, 0, 0, dstWidth, dstHeight);
	//
	var paletteCanvas = document.getElementById("paletteCanvas");
	var paletteHist = getColorHistogram(dstImageData);
	var paletteNum = Object.keys(paletteHist).length;
	var palette = new Uint32Array(paletteNum);
	var i = 0;
	for (var colorId in paletteHist) {
	    colorId = parseFloat(colorId);
	    palette[i] = colorId;
	    i++;
	}
	drawPalette(paletteCanvas, palette);
	document.getElementById("nColorDst").value = getColorNum(dstImageData);
	loadingEnd(div);
	worker = null;
    }
    worker.postMessage({image:srcImageData, method:quantizeMethod},
		       [srcImageData.data.buffer]);
}
