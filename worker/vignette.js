"use strict";
/*
 * 2017/06/13- (c) yoya@awm.jp
 * 2017/10/29- (c) yoya@awm.jp worker
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");
importScripts("../lib/vignette.js");

onmessage = function(e) {
    var imageData = e.data.image;
    mogrifyVignette(imageData, e.data);
    postMessage({image:imageData}, [imageData.data.buffer]);
}
