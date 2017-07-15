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
    var colorspace = e.data.colorspace;
    var dstImageData = drawDiagramPoint(diagramBaseImageData, hist, colorspace);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function graphTrans(xy, width, height) {
    var [x, y] = xy;
    return [x * width, (1 - y) * height];
}

function drawDiagramPoint(imageData, hist, colorspace) {
    var width = imageData.width, height = imageData.height;
    for (var colorId in hist) {
	var [r,g,b,a] = colorId2RGBA(colorId);
	if (a === 0) {
	    continue;
	}
	var lxyz = sRGB2XYZ([r,g,b]);
	var xy = XYZ2xy(lxyz);
	if (colorspace === "ciexy") {
	    var [gx, gy] = graphTrans(xy, width, height);
	} else {
	    var uava = xy2uava(xy);
	    var [gx, gy] = graphTrans(uava, width, height);
	}
	setRGBA(imageData, Math.round(gx), Math.round(gy), [0,0,0, 255]);
    }
    return imageData;
}






