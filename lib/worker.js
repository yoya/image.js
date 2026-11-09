"use strict";
/*
 * 2017/07/03- (c) yoya@awm.jp
 * 2026/11/10- recover from an error in the worker
 */

function workerProcess(workerFile) {
    let worker = null;
    let workerRunning = false;
    let workerNext = null;
    let listeners = [];
    let srcImageData = null;
    let dstTarget = null;  // dstCanvas of the latest request
    const post = function(params, transferHint) {
	if (worker === null) {
	    worker = new Worker(workerFile);
	    worker.onmessage = onmessage;
	    worker.onerror = onerror;
	}
	workerRunning = true;
	worker.postMessage(params, transferHint);
    };
    // run the request that came while the worker was busy, if any
    const postNext = function() {
	if (workerNext === null) {
	    return false;
	}
	const [params, transferHint] = workerNext;
	workerNext = null;
	post(params, transferHint);
	return true;
    };
    const onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	const dstCanvas = dstTarget;
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
	workerRunning = false;
	if (! postNext()) {
	    loadingEnd();  // keep the indicator while the next one runs
	}
	for (let i = 0, n = listeners.length ; i < n ; i++) {
	    const listener = listeners[i];
	    listener(dstImageData, e.data);
	}
    };
    // an exception in the worker: without this, workerRunning stays true
    // and every later request waits forever (the loading indicator too).
    const onerror = function(e) {
	console.error("worker error:", workerFile, e.message);
	worker.terminate();
	worker = null;
	workerRunning = false;
	if (! postNext()) {
	    loadingEnd();
	    if (typeof pageNotify === "function") {
		pageNotify("処理中にエラーが発生しました");
	    }
	}
    };
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
	loadingStart(dstCanvas);
	dstTarget = dstCanvas;
	if (worker && sync) {
	    worker.terminate();
	    worker = null;
	    workerRunning = false;
	    workerNext = null;  // older than this request
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
	    post(params, transferHint);
	}
    }
    // the same listener is registered only once
    // (some callers add it on every redraw)
    this.addListener = function(listener) {
	if (! listeners.includes(listener)) {
	    listeners.push(listener);
	}
    }
}
