"use strict";
/*
 * 2018/04/14- (c) yoya@awm.jp
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var params = e.data;
    var dstImageData = drawBinarize(srcImageData, params);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function randomValue(ratio) {
    var v = Math.random();       //  0.0 <= v < 1.0
    var r = Math.random() - 0.5; // -0.5 <= r < 0.5
    v = Math.sqrt(v);
    if (ratio < r) {
        v = 1 - v;
    }
    if (ratio < -0.5) {
        v = v * (ratio + 1.5) ;
    } else if (0.5 < ratio) {
        v = v * (1.5 - ratio) + (ratio - 0.5);
    }
    return v;
}

function drawBinarize(srcImageData, params) {
    var width = srcImageData.width, height = srcImageData.height;
    var threshold = params.threshold;
    var dither = params.dither;
    var dstImageData = new ImageData(width, height);
    switch (dither) {
    default:
    case "none":
        for (var y = 0 ; y < height; y++) {
            for (var x = 0 ; x < width; x++) {
	        var [r,g,b,a] = getRGBA(srcImageData, x, y);
                r = (r <= threshold)?0:255;
                g = (g <= threshold)?0:255;
                b = (b <= threshold)?0:255;
	        setRGBA(dstImageData, x, y, [r,g,b,a]);
	    }
        }
        break;
    case "random":
        for (var y = 0 ; y < height; y++) {
            for (var x = 0 ; x < width; x++) {
                var ratio = (threshold/255 - 0.5)*3; // 0...255 => -1.5...1.5
                var rnd = randomValue(ratio) * 255;
	        var [r,g,b,a] = getRGBA(srcImageData, x, y);
                r = (r <= rnd)?0:255;
                g = (g <= rnd)?0:255;
                b = (b <= rnd)?0:255;
	        setRGBA(dstImageData, x, y, [r,g,b,a]);
	    }
        }
        break;
    }
    return dstImageData;
}
