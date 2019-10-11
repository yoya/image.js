'use strict';
/*
 * 2017/06/23- (c) yoya@awm.jp
 * 2017/09/04- (c) yoya@awm.jp worker
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    // console.debug("worker/onmessage:", e);
    const srcImageData = e.data.image;
    const fuzz = e.data.fuzz;
    const margin = e.data.margin;
    const srcWidth = srcImageData.width; const srcHeight = srcImageData.height;
    const leftTop = getRGBA(srcImageData, 0, 0);
    const rightTop = getRGBA(srcImageData, srcWidth - 1, 0);
    const leftBottom = getRGBA(srcImageData, 0, srcHeight - 1);
    let minX = matchColorLineNum(srcImageData, leftTop, fuzz, false, 0, 1);
    let maxX = matchColorLineNum(srcImageData, rightTop, fuzz,
                                 false, srcWidth - 1, -1);
    let minY = matchColorLineNum(srcImageData, leftTop, fuzz, true, 0, 1);
    let maxY = matchColorLineNum(srcImageData, leftBottom, fuzz,
				 true, srcHeight - 1, -1);
    console.debug('minX, minY, maxX, maxY:', minX, minY, maxX, maxY);
    // console.debug("margin:", margin);
    minX = (minX < margin) ? 0 : (minX - margin);
    maxX = (srcWidth <= (maxX + margin)) ? (srcWidth - 1) : (maxX + margin);
    minY = (minY < margin) ? 0 : (minY - margin);
    maxY = (srcHeight <= (maxY + margin)) ? (srcHeight - 1) : (maxY + margin);
    //
    const dstWidth  = (maxX > minX) ? (maxX - minX + 1) : 1;
    const dstHeight = (maxY > minY) ? (maxY - minY + 1) : 1;
    const dstImageData = new ImageData(dstWidth, dstHeight);
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX = dstX + minX;
	    const srcY = dstY + minY;
	    const rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function matchColorV(v1, v2, fuzz) {
    let diff;
    if (v2 > v1) {
        diff = v2 - v1;
    } else {
        diff = v1 - v2;
    }
    return (diff / 255 <= fuzz);
}

function matchColor(rgba, rgba2, fuzz) {
    const [r, g, b, a] = rgba;
    const [r2, g2, b2, a2] = rgba2;
    if (matchColorV(r, r2, fuzz) && matchColorV(g, g2, fuzz) &&
	 matchColorV(b, b2, fuzz) && matchColorV(a, a2, fuzz)) {
	return true;
    }
    return false;
}

function matchColorLineNum(imageData, rgba, fuzz, isVert, start, d) {
    const width = imageData.width; const height = imageData.height;
    let num = 0;
    if (isVert) {
	if (d > 0) {
	    for (var y = start; y < height; y += d) {
		for (var x = 0; x < width; x++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return y;
		    }
		}
	    }
            num = height;
	} else if (d === 0) {
	    console.error('ERROR: dy === 0');
	} else { // d < 0
	    for (var y = start; y >= 0; y += d) {
		for (var x = 0; x < width; x++) {
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
	    for (var x = start; x < width; x += d) {
		for (var y = 0; y < height; y++) {
		    var rgba2 = getRGBA(imageData, x, y);
		    if (matchColor(rgba, rgba2, fuzz) === false) {
			return x;
		    }
		}
	    }
            num = width;
	} else if (d === 0) {
	    console.error('ERROR: dx === 0');
	} else { // d < 0
	    for (var x = start; x >= 0; x += d) {
		for (var y = 0; y < height; y++) {
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
