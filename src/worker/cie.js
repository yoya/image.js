'use strict';
/*
 * 2017/06/10- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp  WebWorker
 */

importScripts('../lib/color.js');
importScripts('../lib/canvas.js');

onmessage = function(e) {
    // var imageData = e.data.image; // ignore this
    const diagramBaseImageData = e.data.diagramBaseImageData;
    const hist = e.data.hist;
    const chromaticity = e.data.chromaticity;
    const pointSize = e.data.pointSize;
    const pointDensity = e.data.pointDensity;
    const dstImageData = drawDiagramPoint(diagramBaseImageData, hist, chromaticity, pointSize, pointDensity);
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function graphTrans(xy, width, height) {
    const [x, y] = xy;
    return [x * width, (1 - y) * height];
}

function drawDiagramPoint(imageData, hist, chromaticity, pointSize, pointDensity) {
    const width = imageData.width; const height = imageData.height;
    const [dMin, dMax] = [-(pointSize / 2 - 0.2), (pointSize / 2 - 0.2)];
    const geoHist = new Float32Array(width * height);
    for (const colorId in hist) {
        const count = hist[colorId];
	var [r, g, b, a] = colorId2RGBA(colorId);
	if (a === 0) {
	    continue;
	}
	const lxyz = sRGB2XYZ([r, g, b]);
	var xy = XYZ2xy(lxyz);
	if (chromaticity === 'ciexy') {
	    var [gx, gy] = graphTrans(xy, width, height);
	} else {
	    const uava = xy2uava(xy);
	    var [gx, gy] = graphTrans(uava, width, height);
	}
	for (let dy = dMin; dy < dMax; dy++) {
	    for (let dx = dMin; dx < dMax; dx++) {
                xy = Math.round(gx + dx) + width * Math.round(gy + dy);
                geoHist[xy] += pointDensity;
	    }
	}
    }
    for (var xy in geoHist) {
        const density = geoHist[xy];
        if (density <= 0) {
            continue;
        }
        const x = xy % width;
        const y = (xy - x) / width;
        var [r, g, b, a] = getRGBA(imageData, x, y);
        const rgba = [r * (1 - density), g * (1 - density), b * (1 - density), 255];
	setRGBA(imageData, x, y, rgba);
    }
    return imageData;
}
