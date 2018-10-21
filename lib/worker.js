"use strict";
/*
 * 2017/07/03- (c) yoya@awm.jp
 */


function workerProcess(workerFile) {
    var worker = null;
    var workerRunning = false;
    var workerNext = null;
    var listeners = [];
    
    this.process = function(srcCanvas, dstCanvas, params, sync) {
	if (srcCanvas instanceof HTMLCanvasElement) {
	    var srcCtx = srcCanvas.getContext("2d");
	    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
	    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	} else {
	    var srcImageData = [];
	    for (var i in srcCanvas) {
		var canvas = srcCanvas[i];
		var srcCtx = canvas.getContext("2d");
		var srcWidth = canvas.width, srcHeight = canvas.height;
		var imageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
		srcImageData.push(imageData);
	    }
	}
	var dstCtx = dstCanvas.getContext("2d");
	
	var div = loadingStart();
	
	if (worker && sync) {
	    worker.terminate();
	    worker = null;
	    workerRunning = false;
	}
	if (worker === null) {
	    worker = new Worker(workerFile);
	}
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
	    for (var i = 0, n = listeners.length ; i < n ; i++) {
		var listener = listeners[i];
		listener(dstImageData);
	    }
	}
	params["image"] = srcImageData;
	var transferHint = [];
	for (var key in params) {
	    var p = params[key]
	    if (p instanceof ImageData) {
		transferHint.push(p.data.buffer);
	    } else {
		for (var k in p) { // for srcCanvases
		    var p2 = params[key]
		    if (p2 instanceof ImageData) {
			transferHint.push(p2.data.buffer);
		    }
		}
	    }
	}
	if (workerRunning) {
	    var p = {};
	    Object.assign(p ,params); // assoc array shallow copy
	    workerNext = [p, transferHint];
	} else {
	    workerRunning = true;
	    worker.postMessage(params, transferHint);
	}
    }
    this.addListener = function(listener) {
	listeners.push(listener);
    }
}
