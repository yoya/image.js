'use strict';
/*
 * 2017/07/03- (c) yoya@awm.jp
 */

function workerProcess(workerFile) {
    let worker = null;
    let workerRunning = false;
    let workerNext = null;
    const listeners = [];

    this.process = function(srcCanvas, dstCanvas, params, sync) {
	if (srcCanvas instanceof HTMLCanvasElement) {
	    var srcCtx = srcCanvas.getContext('2d');
	    var srcWidth = srcCanvas.width; var srcHeight = srcCanvas.height;
	    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	} else {
	    var srcImageData = [];
	    for (const i in srcCanvas) {
		const canvas = srcCanvas[i];
		var srcCtx = canvas.getContext('2d');
		var srcWidth = canvas.width; var srcHeight = canvas.height;
		const imageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
		srcImageData.push(imageData);
	    }
	}
	const dstCtx = dstCanvas.getContext('2d');

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
	    const [dstImageData] = [e.data.image];
	    const dstWidth = dstImageData.width;
	    const dstHeight = dstImageData.height;
	    dstCanvas.width  = dstWidth;
	    dstCanvas.height = dstHeight;
	    dstCtx.putImageData(dstImageData, 0, 0);
	    loadingEnd(div);
	    workerRunning = false;
	    if (workerNext !== null) {
		const [params, transferHint] = workerNext;
		workerNext = null;
		workerRunning = true;
		worker.postMessage(params, transferHint);
	    }
	    for (let i = 0, n = listeners.length; i < n; i++) {
		const listener = listeners[i];
		listener(dstImageData);
	    }
	};
	params.image = srcImageData;
	const transferHint = [];
	for (const key in params) {
	    var p = params[key];
	    if (p instanceof ImageData) {
		transferHint.push(p.data.buffer);
	    } else {
		for (const k in p) { // for srcCanvases
		    const p2 = params[key];
		    if (p2 instanceof ImageData) {
			transferHint.push(p2.data.buffer);
		    }
		}
	    }
	}
	if (workerRunning) {
	    var p = {};
	    Object.assign(p, params); // assoc array shallow copy
	    workerNext = [p, transferHint];
	} else {
	    workerRunning = true;
	    worker.postMessage(params, transferHint);
	}
    };
    this.addListener = function(listener) {
	listeners.push(listener);
    };
}
