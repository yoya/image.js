'use strict';
/*
 * 2017/03/17- (c) yoya@awm.jp : algorithm
 * 2017/06/25- (c) yoya@awm.jp : worker
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    const [srcImageData, quantizeMethod] = [e.data.image, e.data.method];
    const srcWidth = srcImageData.width;
    const srcHeight = srcImageData.height;
    const dstImageData = new ImageData(srcWidth, srcHeight);
    drawColorReduction(srcImageData, dstImageData, quantizeMethod);
    //
    const paletteHist = getColorHistogram(dstImageData);
    const paletteNum = Object.keys(paletteHist).length;
    const palette = new Uint32Array(paletteNum);
    let i = 0;
    for (let colorId in paletteHist) {
	colorId = parseFloat(colorId);
	palette[i] = colorId;
	i++;
    }
    postMessage({ image:dstImageData, palette:palette },
		[dstImageData.data.buffer]);
};

function drawColorReduction(srcImageData, dstImageData, quantizeMethod) {
    switch (quantizeMethod) {
    case 'uniform': // 均等量子化法
	drawColorReduction_uniform(srcImageData, dstImageData);
	break;
    case 'popularity': // 頻度法
	drawColorReduction_popularity(srcImageData, dstImageData);
	break;
    default:
	console.error('Unknown quantizeMethod:' + quantizeMethod);
	break;
    }
}

/*
 * 均等量子化法 (uniform quqntization)
 */
function drawColorReduction_uniform(srcImageData, dstImageData) {
    // console.debug("drawColorReduction");
    //
    const srcWidth = srcImageData.width; const srcHeight = srcImageData.height;
    const dstWidth = dstImageData.width; const dstHeight = dstImageData.height;
    //
    for (let srcY = 0; srcY < srcHeight; srcY++) {
        for (let srcX = 0; srcX < srcWidth; srcX++) {
	    const dstX = srcX; const dstY = srcY;
	    const rgba = getRGBA(srcImageData, srcX, srcY);
	    const [r, g, b] = rgba;
//	    rgba[0] = Math.round(r * 7 / 0xff) * 0xff / 7;
//	    rgba[1] = Math.round(g * 5 / 0xff) * 0xff / 5;
//	    rgba[2] = Math.round(b * 4 / 0xff) * 0xff / 4;
	    rgba[0] = (r & 0xe0) + (0xff - 0xe0) / 2; // 1110 0000
	    rgba[1] = (g & 0xe0) + (0xff - 0xe0) / 2; // 1110 0000
	    rgba[2] = (b & 0xc0) + (0xff - 0xc0) / 2; // 1100 0000
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}

/*
 * 頻度法 popularity algorithm
 */
function drawColorReduction_popularity(srcImageData, dstImageData) {
    // console.debug("drawColorReduction");
    //
    const srcWidth = srcImageData.width; var srcHeight = srcImageData.height;
    const dstWidth = dstImageData.width; var srcHeight = dstImageData.height;
    //
    const hist = getColorHistogram(srcImageData);
    const colorNum = Object.keys(hist).length;
    const histArray = [];
    for (var colorId in hist) {
	colorId = parseFloat(colorId);
	histArray.push({ colorId:colorId, count:hist[colorId] });
    }
    console.debug('HistogramSort');
    console.time('HistogramSort');
    histArray.sort(function(a, b) {
	return (a.count < b.count) ? 1 : -1; // descend order
    });
    console.timeEnd('HistogramSort');
    const paletteNum = (colorNum < 256) ? colorNum : 256;
    const palette = new Uint32Array(paletteNum);
    var colorId = null;
    const colorMap = {};
    console.debug('ColorMapMaking');
    console.time('ColorMapMaking');
    for (var i = 0; i < paletteNum; i++) {
	colorId = histArray[i].colorId;
	palette[i] = colorId;
	colorMap[colorId] = colorId;
    }
    for (var i = paletteNum; i < colorNum; i++) {
	colorId = histArray[i].colorId;
	let closestId = palette[0];
	let closestDistance = getColorIdDistance_nosqrt(colorId, closestId);
	for (let j = 1; j < paletteNum; j++) {
	    const distance = getColorIdDistance_nosqrt(colorId, palette[j]);
	    if (distance < closestDistance) {
		closestId = palette[j];
		closestDistance = distance;
	    }
	}
	colorMap[colorId] = closestId;
	// console.debug(colorId2RGBA(colorId), colorId2RGBA(closestId), closestDistance);
    }
    console.timeEnd('ColorMapMaking');
    for (let srcY = 0; srcY < srcHeight; srcY++) {
        for (let srcX = 0; srcX < srcWidth; srcX++) {
	    const dstX = srcX; const dstY = srcY;
	    let rgba = getRGBA(srcImageData, srcX, srcY);
	    colorId = RGBA2colorId(rgba);
	    colorId = colorMap[colorId];
	    rgba = colorId2RGBA(colorId);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}
