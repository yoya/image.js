"use strict";
/*
 * 2018/12/03- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = LBP(srcImageData, x, y);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

var LBPorder = [0, 1, 2, 5, 8, 7, 6, 3]; // clock-wise order
    
function LBPbuild(arr) {
    var center = arr[4];
    var v = 0;
    for (var i = 0 ; i < 8 ; i++) {
	v <<= 1;
	v += (center < arr[LBPorder[i]])? 0 : 1
    }
    return v;
}

function LBP(srcImageData, srcX, srcY) {
    var rArr = [], gArr = [], bArr = [];
    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    for (var y = -1 ; y <= 1 ; y++) {
	for (var x = -1 ; x <= 1 ; x++) {
	    [r, g, b] = getRGBA(srcImageData, srcX + x, srcY + y);
	    rArr.push(r);
	    gArr.push(g);
	    bArr.push(b)
	}
    }
    return [LBPbuild(rArr), LBPbuild(gArr), LBPbuild(bArr), a];
}
