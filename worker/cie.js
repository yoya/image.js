"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp  WebWorker
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var imageData = e.data.image; // ignore this
    var diagramBaseImageData = e.data.diagramBaseImageData;
    var hist = e.data.hist;
    var chromaticity = e.data.chromaticity;
    var pointSize = e.data.pointSize;
    var dstImageData = drawDiagramPoint(diagramBaseImageData, hist, chromaticity, pointSize);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function graphTrans(xy, width, height) {
    var [x, y] = xy;
    return [x * width, (1 - y) * height];
}

function drawDiagramPoint(imageData, hist, chromaticity, pointSize) {
    var width = imageData.width, height = imageData.height;
    var pointRGBA = [0,0,0, 255];
    var [dMin, dMax] = [-(pointSize/2-0.2),(pointSize/2-0.2)];
    for (var colorId in hist) {
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
		setRGBA(imageData, Math.round(gx+dx), Math.round(gy+dy), pointRGBA);
	    }
	}
    }
    return imageData;
}






