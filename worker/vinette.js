"use strict";
/*
 * 2017/06/13- (c) yoya@awm.jp
 * 2017/10/29- (c) yoya@awm.jp worker
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");
importScripts("../lib/vinette.js");

onmessage = function(e) {
    var imageData = e.data.image;
    mogrifyVinette(imageData, e.data);
    postMessage({image:imageData}, [imageData.data.buffer]);
}
