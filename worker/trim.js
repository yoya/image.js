"use strict";
/*
 * 2017/06/23- (c) yoya@awm.jp
 * 2017/09/04- (c) yoya@awm.jp worker
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    // console.debug("worker/onmessage:", e);
    var srcImageData = e.data.image;
    var fuzz = e.data.fuzz;
    var margin = e.data.margin;
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var leftTop = getRGBA(srcImageData, 0, 0);
    var rightTop = getRGBA(srcImageData, srcWidth - 1, 0);
    var leftBottom = getRGBA(srcImageData, 0, srcHeight - 1);
    var minX = matchColorLineNum(srcImageData, leftTop, fuzz, false, 0, 1);
    var maxX = matchColorLineNum(srcImageData, rightTop, fuzz,
                                 false, srcWidth-1, -1);
    var minY = matchColorLineNum(srcImageData, leftTop, fuzz, true, 0, 1);
    var maxY = matchColorLineNum(srcImageData, leftBottom, fuzz,
				 true, srcHeight-1, -1);
    console.debug("minX, minY, maxX, maxY:", minX, minY, maxX, maxY);
    // console.debug("margin:", margin);
    minX = (minX < margin)?0:(minX - margin);
    maxX = (srcWidth <= (maxX + margin)) ? (srcWidth-1) : (maxX + margin);
    minY = (minY < margin) ? 0 : (minY - margin);
    maxY = (srcHeight <= (maxY + margin)) ? (srcHeight-1) : (maxY + margin);
    //
    var dstWidth  = (maxX > minX)?(maxX - minX + 1):1;
    var dstHeight = (maxY > minY)?(maxY - minY + 1):1;
    var dstImageData = new ImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX + minX;
	    var srcY = dstY + minY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function matchColorV(v, v2, fuzz) {
    if (v < v2) {
	var min = v, max = v2;
    } else {
	var min = v2, max = v;
    }
    if (max === 0) {
	return true;
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
			return y;
		    }
		}
	    }
            num = height;
	} else if (d === 0) {
	    console.error("ERROR: dy === 0");
	} else { // d < 0
	    for (var y = start ; y >= 0 ; y+= d) {
		for (var x = 0 ; x < width ; x++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return y;
		    }
		}
	    }
             num = 0;
	}
    } else { // ! isVert
	if (d > 0) {
	    for (var x = start ; x < width ; x+= d) {
		for (var y = 0 ; y < height ; y++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return x;
		    }
		}
	    }
            num = width;
	} else if (d === 0) {
	    console.error("ERROR: dx === 0");
	} else { // d < 0
	    for (var x = start ; x >= 0 ; x+= d) {
		for (var y = 0 ; y < height ; y++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return x;
		    }
		}
	    }
            num = height;
	}
    }
    // console.debug("perfect color match", isVert, start, d, num);
    return num;
}
