"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp  WebWorker
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [imageData, hist, colorspace] = [e.data.image, e.data.hist,
					 e.data.colorspace];
    var imagaData = drawDiagramPoint(imageData, hist, colorspace);
    postMessage({image:imageData}, [imageData.data.buffer]);
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






