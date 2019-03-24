"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp  WebWorker
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    // var imageData = e.data.image; // ignore this
    var diagramBaseImageData = e.data.diagramBaseImageData;
    var hist = e.data.hist;
    var chromaticity = e.data.chromaticity;
    var pointSize = e.data.pointSize;
    var pointDensity = e.data.pointDensity;
    var dstImageData = drawDiagramPoint(diagramBaseImageData, hist, chromaticity, pointSize, pointDensity);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function graphTrans(xy, width, height) {
    var [x, y] = xy;
    return [x * width, (1 - y) * height];
}

function drawDiagramPoint(imageData, hist, chromaticity, pointSize, pointDensity) {
    var width = imageData.width, height = imageData.height;
    var [dMin, dMax] = [-(pointSize/2-0.2),(pointSize/2-0.2)];
    var geoHist = new Float32Array(width * height);
    for (var colorId in hist) {
        var count = hist[colorId]
	var [r,g,b,a] = colorId2RGBA(colorId);
	if (a === 0) {
	    continue;
	}
	var lxyz = sRGB2XYZ([r,g,b]);
	var xy = XYZ2xy(lxyz);
	if (chromaticity === "ciexy") {
	    var [gx, gy] = graphTrans(xy, width, height);
	} else {
	    var uava = xy2uava(xy);
	    var [gx, gy] = graphTrans(uava, width, height);
	}
	for (var dy = dMin ; dy < dMax ; dy++) {
	    for (var dx = dMin ; dx < dMax ; dx++) {
                xy = Math.round(gx+dx) + width * Math.round(gy+dy);
                geoHist[xy]+= pointDensity;
	    }
	}
    }
    for (var xy in geoHist) {
        var density = geoHist[xy];
        if (density <= 0) {
            continue;
        }
        var x = xy % width;
        var y = (xy - x) / width;
        var [r, g, b, a] = getRGBA(imageData, x, y);
        var rgba = [r * (1-density), g * (1-density), b * (1-density), 255];
	setRGBA(imageData, x, y, rgba);
    }
    return imageData;
}






