"use strict";
/*
 * 2017/06/28- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");
importScripts("../lib/math.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var filterMatrix = e.data.filterMatrix;
    var filterWindow = e.data.filterWindow;
    var sigma = e.data.sigma;
    var bilateral = e.data.bilateral;
    var colorScale = e.data.colorScale;
    //
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    //
    if (bilateral == false) {
	for (var y = 0 ; y < height; y++) {
            for (var x = 0 ; x < width; x++) {
		var rgba = smoothing(srcImageData, x, y,
				     filterMatrix, filterWindow);
		setRGBA(dstImageData, x, y, rgba);
	    }
	}
    } else { // bilateral == true
	//
	for (var y = 0 ; y < height; y++) {
            for (var x = 0 ; x < width; x++) {
		var rgba = smoothingBilateral(srcImageData, x, y,
					      filterMatrix, filterWindow,
					      sigma, colorScale);
		setRGBA(dstImageData, x, y, rgba);
	    }
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function smoothing(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r2, g2, b2, a2] = [0,0,0,0];
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
	    r2 += r * filterMatrix[i];
	    g2 += g * filterMatrix[i];
	    b2 += b * filterMatrix[i];
	    i++;
	}
    }
    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    return [r2, g2, b2, a];
}

function smoothingBilateral(srcImageData, srcX, srcY,
			    filterMatrix, convWindow, sigma, colorScale) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r2, g2, b2, a2] = [0,0,0,0];
    var [r0, g0, b0, a0] = getRGBA(srcImageData, srcX, srcY);
    var rSum = 0, gSum = 0, bSum = 0;
    var center  = Math.floor(convWindow / 2);
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++, i++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
	    var filterWeight = filterMatrix[i];
	    var rD = (r0 - r) / colorScale;
	    var gD = (g0 - g) / colorScale;
	    var bD = (b0 - b) / colorScale;
	    var rF = gaussian(Math.abs(rD), 0, sigma);
	    var gF = gaussian(Math.abs(gD), 0, sigma);
	    var bF = gaussian(Math.abs(bD), 0, sigma);
	    rF *= filterWeight;
	    gF *= filterWeight;
	    bF *= filterWeight;
	    // bilateral
	    r2 += r * rF;
	    g2 += g * gF;
	    b2 += b * bF;
	    //
	    rSum += rF;
	    gSum += gF;
	    bSum += bF;
	}
    }
    // console.log("rSum, gSum, bSum", rSum, gSum, bSum);
    r2 = Math.floor(r2 / rSum);
    g2 = Math.floor(g2 / gSum);
    b2 = Math.floor(b2 / bSum);
    return [r2, g2, b2, a0];
}
