'use strict';
/*
 * 2017/06/28- (c) yoya@awm.jp
 */

importScripts('../lib/canvas.js');
importScripts('../lib/math.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const filterMatrix = e.data.filterMatrix;
    const filterWindow = e.data.filterWindow;
    const sigma = e.data.sigma;
    const bilateral = e.data.bilateral;
    const colorScale = e.data.colorScale;
    //
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    //
    if (bilateral == false) {
	for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
		var rgba = smoothing(srcImageData, x, y,
				     filterMatrix, filterWindow);
		setRGBA(dstImageData, x, y, rgba);
	    }
	}
    } else { // bilateral == true
	//
	for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
		var rgba = smoothingBilateral(srcImageData, x, y,
					      filterMatrix, filterWindow,
					      sigma, colorScale);
		setRGBA(dstImageData, x, y, rgba);
	    }
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function smoothing(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    const startX = srcX - (convWindow - 1) / 2; const endX = startX + convWindow;
    const startY = srcY - (convWindow - 1) / 2; const endY = startY + convWindow;
    let i = 0;
    let [r2, g2, b2, a2] = [0, 0, 0, 0];
    for (let y = startY; y < endY; y++) {
	for (let x = startX; x < endX; x++) {
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
    const startX = srcX - (convWindow - 1) / 2; const endX = startX + convWindow;
    const startY = srcY - (convWindow - 1) / 2; const endY = startY + convWindow;
    let i = 0;
    let [r2, g2, b2, a2] = [0, 0, 0, 0];
    const [r0, g0, b0, a0] = getRGBA(srcImageData, srcX, srcY);
    let rSum = 0; let gSum = 0; let bSum = 0;
    const center  = Math.floor(convWindow / 2);
    for (let y = startY; y < endY; y++) {
	for (let x = startX; x < endX; x++, i++) {
	    const [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
	    const filterWeight = filterMatrix[i];
	    const rD = (r0 - r) / colorScale;
	    const gD = (g0 - g) / colorScale;
	    const bD = (b0 - b) / colorScale;
	    let rF = gaussian(Math.abs(rD), 0, sigma);
	    let gF = gaussian(Math.abs(gD), 0, sigma);
	    let bF = gaussian(Math.abs(bD), 0, sigma);
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
