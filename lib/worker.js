"use strict";
/*
 * 2017/07/03- (c) yoya@awm.jp
 */

var workerRunning = false;
var workerNext = null;

function workerProcess(worker, srcCanvas, dstCanvas, params) {
    // console.debug("drawAffinTransform");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);

    var div = loadingStart();

    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth = dstImageData.width;
	var dstHeight = dstImageData.height;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	dstCtx.putImageData(dstImageData, 0, 0);
	loadingEnd(div);
	workerRunning = false;
	if (workerNext !== null) {
	    var [params, transferHint] = workerNext;
	    workerNext = null;
	    workerRunning = true;
	    worker.postMessage(params, transferHint);
	}
    }
    params["image"] = srcImageData;
    var transferHint = [srcImageData.data.buffer];
    if (workerRunning) {
	workerNext = [params, transferHint];
    } else {
	workerRunning = true;
	worker.postMessage(params, transferHint);
    }
}
