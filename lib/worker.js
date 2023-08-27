"use strict";
/*
 * 2017/07/03- (c) yoya@awm.jp
 */

function workerProcess(workerFile) {
    let worker = null;
    let workerRunning = false;
    let workerNext = null;
    let listeners = [];
    let srcImageData = null;
    this.process = function(srcCanvas, dstCanvas, params, sync) {
	if (srcCanvas instanceof HTMLCanvasElement) {
            const options = { willReadFrequently: true };
	    const srcCtx = srcCanvas.getContext("2d", options);
	    const srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
	    srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	} else {
	    srcImageData = [];
	    for (var i in srcCanvas) {
                const canvas = srcCanvas[i];
		const options = { willReadFrequently: true };
		const srcCtx = canvas.getContext("2d", options);
		const srcWidth = canvas.width, srcHeight = canvas.height;
		const imageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
		srcImageData.push(imageData);
	    }
	}
	const div = loadingStart();
	
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
            // var dstImageData = e.data.image;
	    if (dstCanvas instanceof HTMLCanvasElement) {
	        const dstWidth = dstImageData.width;
	        const dstHeight = dstImageData.height;
                const dstCtx = dstCanvas.getContext("2d");
	        dstCanvas.width  = dstWidth;
	        dstCanvas.height = dstHeight;
	        dstCtx.putImageData(dstImageData, 0, 0);
            } else {
	        for (let i in dstCanvas) {
		    const canvas = dstCanvas[i];
                    const imageData = dstImageData[i];
	            canvas.width  = imageData.width;
	            canvas.height = imageData.height;
                    const ctx = canvas.getContext("2d");
	            ctx.putImageData(imageData, 0, 0);
                }
            }
	    loadingEnd(div);
	    workerRunning = false;
	    if (workerNext !== null) {
		const [params, transferHint] = workerNext;
		workerNext = null;
		workerRunning = true;
		worker.postMessage(params, transferHint);
	    }
	    for (let i = 0, n = listeners.length ; i < n ; i++) {
		const listener = listeners[i];
		listener(dstImageData, e.data);
	    }
	}
	params["image"] = srcImageData;
	var transferHint = [];
	for (let key in params) {
	    const p = params[key]
	    if (p instanceof ImageData) {
		transferHint.push(p.data.buffer);
	    } else {
		for (let key2 in p) { // for srcCanvases
		    var p2 = p[key2]
		    if (p2 instanceof ImageData) {
			transferHint.push(p2.data.buffer);
		    }
		}
	    }
	}
	if (workerRunning) {
	    const p = {};
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
