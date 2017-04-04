"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var offCanvas = document.createElement("canvas"); // 2^n size
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndDCT(srcImage, srcCanvas, offCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndDCT(srcImage, srcCanvas, offCanvas, dstCanvas);
		 } );
}

function drawSrcImageAndDCT(srcImage, srcCanvas, offCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    draw2NCanvas(srcCanvas, offCanvas);
    drawDCT(offCanvas, dstCanvas);
}

function draw2NCanvas(srcCanvas, dstCanvas) {
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width;
    var srcHeight = srcCanvas.height;
    var w = Math.log2(srcCanvas.width) >>> 0;
    var h = Math.log2(srcCanvas.height) >>> 0;
    var n = (w < h)? w : h;
    var dstWidth = Math.pow(2, n);
    var dstHeight = dstWidth;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    dstCtx.drawImage(srcCanvas, 0, 0, srcWidth, srcHeight,
		     0, 0, dstWidth, dstHeight);
}


function drawDCT(srcCanvas, dstCanvas) {
    // console.log(srcCanvas); // XXX
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    dstCtx.fillStyle = '#ffffff';
    dstCtx.fillRect(0, 0, width, height);
    
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var dstImageData = dstCtx.createImageData(width, height);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;

    //
    FFT.init(width);
    var nSample = width * height;
    var re = new Float32Array(nSample);
    var im = new Float32Array(nSample);
    var i = 0;
    for(var y = 0; y < height; y++) {
	for(var x = 0; x < width; x++) {
	    var o = i << 2;
	    var val = (3 * srcData[o++]  + 6 * srcData[o++]  + srcData[o++]) / 10;
	    re[i++] = val;
	    // im[i] = 0;
	}
    }
    FFT.fft2d(re, im);
    swapQuadrant(re, width, height);
    swapQuadrant(im, width, height);
    var spectrum = new Float32Array(nSample);
    var maxSpectrum = 0;
    for (var i = 0 ; i < nSample ; i++) {
	var s = Math.log(Math.sqrt(re[i]*re[i] + im[i]*im[i]));
	spectrum[i] = s;
	if (s > maxSpectrum) {
	    maxSpectrum = s;
	}
    }
    var i = 0;
    var normFactor = 255 / maxSpectrum;
    for (var y = 0; y < height; y++) {
	for (var x = 0; x < width; x++) {
	    var o = i << 2;
	    var val = spectrum[i] * normFactor;
	    dstData[o++] = 64 + (val >> 2);
	    dstData[o++] = val;
	    dstData[o++] = val >> 1;
	    dstData[o++] = 255;
	    i++;
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

// 象限シフト
function swapQuadrant(data, width, height) {
    var nSample = width * height
    var nSample_2 = nSample / 2;
    var nSample_3 = nSample * 3 / 4;
    var width_2 = width / 2 , height_2 = height / 2;
    var i, j;
    for (var y = 0 ; y < height_2 ; y++) {
	i = y * width;
	j = i + nSample_2 + width_2;
	for (var x = 0 ; x < width_2 ; x++) {
	    [data[i], data[j]] = [data[j], data[i]];
	    i++; j++;
	}
    }
    for (var y = 0 ; y < height_2 ; y++) {
	i = y * width + width_2;
	j = i + nSample_2 - width_2;
	for (var x = width_2 ; x < width; x++) {
	    [data[i], data[j]] = [data[j], data[i]];
	    i++; j++;
	}
    }
}
