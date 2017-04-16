"use strict";
/*
 * 2017/04/16- (c) yoya@awm.jp
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
    var filter = document.getElementById("filterSelect").value;
    var filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"filterSelect":null, "filterWindowRange":"filterWindowText"},
		 function() {
		     filter = document.getElementById("filterSelect").value;
		     filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow);
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow);
		 } );
}

function medianFilter(srcImageData, srcX, srcY, filter, filterWindow) {
    var startX = srcX - (((filterWindow-1)/2) >>> 0);
    var startY = srcY - (((filterWindow-1)/2) >>> 0);
    var endX = startX + filterWindow;
    var endY = startY + filterWindow;
    var windowArea = filterWindow * filterWindow;
    var rArr = new Uint8Array(windowArea);
    var gArr = new Uint8Array(windowArea);
    var bArr = new Uint8Array(windowArea);
    var aArr = new Uint8Array(windowArea);
    var i = 0;
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    rArr[i] = r;
	    gArr[i] = g;
	    bArr[i] = b;
	    aArr[i] = a;
	    i++;
	}
    }
    var compareFunc = function(a, b) {
	return a - b;
    }
    rArr.sort(compareFunc);
    gArr.sort(compareFunc);
    bArr.sort(compareFunc);
    aArr.sort(compareFunc);
    var rgba = [255, 0, 0, 255];
    switch (filter) {
	case "max":
	rgba = [rArr[windowArea-1], gArr[windowArea-1],
		bArr[windowArea-1], aArr[windowArea-1]];
	break;
	case "median":
	var windowArea_2 = ((windowArea-1) / 2) >>> 0;
	rgba = [rArr[windowArea_2], gArr[windowArea_2],
		bArr[windowArea_2], aArr[windowArea_2]];
		break;
	case "min":
	rgba =  [rArr[0], gArr[0], bArr[0], aArr[0]];
	break;
    default:
	console.error("Illegal filter:"+filter);
    }
    return rgba;
}

function drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow) {
    console.debug("drawMedianFilter:", filter, filterWindow);
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgba = medianFilter(srcImageData, srcX, srcY, filter, filterWindow);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
