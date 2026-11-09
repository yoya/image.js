"use strict";
/*
 * 2018/08/28- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var params = {};

    
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            let maxWidthHeight = params.maxWidthHeight;
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    params.stride = srcCanvas.width;
	    syncParamsToElements(params, {keys: ["stride"]});
	    drawStride(srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     let maxWidthHeight = params.maxWidthHeight;
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     if ((key === "maxWidthHeight")) {
			 params.stride = srcCanvas.width;
			 syncParamsToElements(params, {keys: ["stride"]});
		     }
		     drawStride(srcCanvas, dstCanvas, params);
		 }, {keys: ["maxWidthHeight", "stride"]});
}

function drawStride(srcCanvas, dstCanvas, params) {
    // console.debug("drawCopy");
    let stride = params.stride;
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = stride;
    var dstHeight = Math.ceil(srcWidth * srcHeight / stride)
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    // https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
    dstImageData.data.set(srcImageData.data); // copy
    dstCtx.putImageData(dstImageData, 0, 0);
}
