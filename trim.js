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
    var fuzz = parseFloat(document.getElementById("fuzzRange").value);
    var margin = parseFloat(document.getElementById("marginRange").value);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawTrim(srcCanvas, dstCanvas, fuzz, margin);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawTrim(srcCanvas, dstCanvas, fuzz, margin);
		 } );
    bindFunction({"fuzzRange":"fuzzText",
		  "marginRange":"marginText"},
		 function() {
		     fuzz = parseFloat(document.getElementById("fuzzRange").value);
		     margin = parseFloat(document.getElementById("marginRange").value);
		     drawTrim(srcCanvas, dstCanvas, fuzz, margin);
		 } );
}

function matchColorV(v, v2, fuzz) {
    if (v < v2) {
	var min = v, max = v2;
    } else {
	var min = v2, max = v;
    }
    if (max === 0) {
	return 0
    }
    return ((max-min)/max <= fuzz);
}

function matchColor(rgba, rgba2, fuzz) {
    var [r, g, b, a] = rgba;
    var [r2, g2, b2, a2] = rgba2;
    if ( matchColorV(r, r2, fuzz) && matchColorV(g, g2, fuzz) &&
	 matchColorV(b, b2, fuzz) && matchColorV(a, a2, fuzz) ) {
	return true
    }
    return false;
}

function matchColorLineNum(imageData, rgba, fuzz, isVert, start, d) {
    var width = imageData.width, height = imageData.height;
    var num = 0;
    if (isVert) {
	if (d > 0) {
	    for (var y = start ; y < height ; y+= d) {
		for (var x = 0 ; x < width ; x++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return num;
		    }
		}
		num ++;
	    }
	} else if (d === 0) {
	    console.error("ERROR: dy === 0");
	} else { // d < 0
	    for (var y = start ; y >= 0 ; y+= d) {
		for (var x = 0 ; x < width ; x++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return num;
		    }
		}
		num ++;
	    }
	}
    } else { // ! isVert
	if (d > 0) {
	    for (var x = start ; x < width ; x+= d) {
		for (var y = 0 ; y < height ; y++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return num;
		    }
		}
		num ++;
	    }
	} else if (d === 0) {
	    console.error("ERROR: dx === 0");
	} else { // d < 0
	    for (var x = start ; x >= 0 ; x+= d) {
		for (var y = 0 ; y < height ; y++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return num;
		    }
		}
		num ++;
	    }
	}
    }
    // console.debug("perfect color match", isVert, start, d, num);
    return num;
}

function drawTrim(srcCanvas, dstCanvas, fuzz, margin) {
    // console.debug("drawTrim");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var baseRGBA = getRGBA(srcImageData, 0, 0);
    var minX = matchColorLineNum(srcImageData, baseRGBA, fuzz,
				 false, 0, 1);
    var maxX = srcWidth - matchColorLineNum(srcImageData, baseRGBA, fuzz,
					    false, srcWidth-1, -1);
    var minY = matchColorLineNum(srcImageData, baseRGBA, fuzz,
				 true, 0, 1);
    var maxY = srcHeight - matchColorLineNum(srcImageData, baseRGBA, fuzz,
					     true, srcHeight-1, -1);
    // console.debug("minX, minY, maxX, maxY:", minX, minY, maxX, maxY);
    // console.debug("margin:", margin);
    minX = (minX < margin)?0:(minX - margin);
    maxX = (srcWidth <= (maxX + margin)) ? (srcWidth-1) : (maxX + margin);
    minY = (minY < margin) ? 0 : (minY - margin);
    maxY = (srcHeight <= (maxY + margin)) ? (srcHeight-1) : (maxY + margin);
    //
    var dstWidth  = (maxX > minX)?(maxX - minX):1;
    var dstHeight = (maxY > minY)?(maxY - minY):1;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX + minX;
	    var srcY = dstY + minY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
