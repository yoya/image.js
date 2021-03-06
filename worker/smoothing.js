"use strict";
/*
 * 2017/06/28- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");
importScripts("../lib/math.js");  // gaussian
importScripts("../lib/kernel.js");
importScripts("../lib/smoothing.js");

onmessage = function(e) {
    const srcImageData = e.data.image;
    const dstImageData = convertSmoothing(srcImageData, e.data);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
