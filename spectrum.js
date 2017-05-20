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
    var src2NCanvas = document.getElementById("src2NCanvas"); // 2^n size
    var dst2NCanvas = document.getElementById("dst2NCanvas"); // 2^n size
    var srcSpectrumRedCanvas   = document.getElementById("srcSpectrumRedCanvas");
    var srcSpectrumGreenCanvas = document.getElementById("srcSpectrumGreenCanvas");
    var srcSpectrumBlueCanvas  = document.getElementById("srcSpectrumBlueCanvas");
    var dstSpectrumRedCanvas   = document.getElementById("dstSpectrumRedCanvas");
    var dstSpectrumGreenCanvas = document.getElementById("dstSpectrumGreenCanvas");
    var dstSpectrumBlueCanvas  = document.getElementById("dstSpectrumBlueCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas,
					srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumBlueCanvas,
					dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
					dst2NCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "highPassRange":"highPassText",
		  "lowPassRange":"lowPassText",
		  "keepContrastCheckbox":null,
		  "floor2NCheckbox":null},
		 function() {
	    drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas,
					srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumBlueCanvas,
					dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
					dst2NCanvas, dstCanvas);

		 } );
}

function drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas,
				     srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumblueCanvas,
				     dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
				     dst2NCanvas, dstCanvas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var highPass = parseFloat(document.getElementById("highPassRange").value);
    var lowPass = parseFloat(document.getElementById("lowPassRange").value);
    var keepContrast = document.getElementById("keepContrastCheckbox").checked;
    var floor2N = document.getElementById("floor2NCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    draw2NCanvas(srcCanvas, src2NCanvas ,floor2N);

    var [redSpectrum, greenSpectrum, blueSpectrum] = calcDCT(src2NCanvas);
    var maxRedSpectrumPower   = drawSpectrum(srcSpectrumRedCanvas,   redSpectrum,   null, 0)
    var maxGreenSpectrumPower = drawSpectrum(srcSpectrumGreenCanvas, greenSpectrum, null, 1);
    var maxBlueSpectrumPower  = drawSpectrum(srcSpectrumBlueCanvas,  blueSpectrum,  null, 2);
    redSpectrum   = SpectrumFilter(redSpectrum,   highPass, lowPass);
    greenSpectrum = SpectrumFilter(greenSpectrum, highPass, lowPass);
    blueSpectrum  = SpectrumFilter(blueSpectrum,  highPass, lowPass);
    // console.log(maxRedSpectrumPower);
    drawSpectrum(dstSpectrumRedCanvas,   redSpectrum,   maxRedSpectrumPower,   0);
    drawSpectrum(dstSpectrumGreenCanvas, greenSpectrum, maxGreenSpectrumPower, 1);
    drawSpectrum(dstSpectrumBlueCanvas,  blueSpectrum,  maxBlueSpectrumPower,  2);
    drawFromDCT(dst2NCanvas, redSpectrum, greenSpectrum, blueSpectrum, keepContrast, src2NCanvas);
    dstCanvas.width  = srcCanvas.width;
    dstCanvas.height = srcCanvas.height;
    drawFrom2NCanvas(dst2NCanvas, dstCanvas);
}

function draw2NCanvas(srcCanvas, dstCanvas, floor2N) {
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width;
    var srcHeight = srcCanvas.height;
    var w = Math.log2(srcCanvas.width);
    var h = Math.log2(srcCanvas.height);
    if (floor2N) {
	w = Math.floor(w);
	h = Math.floor(h);
	var n = (w < h)? w : h;
    } else {
	w = Math.ceil(w);
	h = Math.ceil(h);
	var n = (w > h)? w : h;
    }
    var dstWidth = Math.pow(2, n);
    var dstHeight = dstWidth;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    dstCtx.drawImage(srcCanvas, 0, 0, srcWidth, srcHeight,
		     0, 0, dstWidth, dstHeight);
}

function calcDCT(srcCanvas) {
    // console.log(srcCanvas); // XXX
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var srcData = srcImageData.data;
    //
    var nSample = width * height;
    var reRed   = new Float32Array(nSample);
    var imRed   = new Float32Array(nSample);
    var reGreen = new Float32Array(nSample);
    var imGreen = new Float32Array(nSample);
    var reBlue  = new Float32Array(nSample);
    var imBlue  = new Float32Array(nSample);
    var i = 0;
    for(var y = 0; y < height; y++) {
	for(var x = 0; x < width; x++) {
	    var o = i << 2;
	    reRed[i]   = srcData[o++];
	    reGreen[i] = srcData[o++];
	    reBlue[i]  = srcData[o++];
	    // imRed[i] = imGreen[i] = imBlue[i] = 0;
	    i++;
	}
    }
    FFT.init(width);
    FFT.fft2d(reRed, imRed);
    swapQuadrant(reRed, width, height);
    swapQuadrant(imRed, width, height);
    FFT.fft2d(reGreen, imGreen);
    swapQuadrant(reGreen, width, height);
    swapQuadrant(imGreen, width, height);
    FFT.fft2d(reBlue, imBlue);
    swapQuadrant(reBlue, width, height);
    swapQuadrant(imBlue, width, height);
    return [[reRed, imRed], [reGreen, imGreen], [reBlue, imBlue]];
}

function drawSpectrum(dstCanvas, spectrum, maxSpectrumPower, color) {
    var [re, im] = spectrum;
    var dstCtx = dstCanvas.getContext("2d");
    var nSample = re.length;
    var width = Math.sqrt(nSample);
    var height = width;
    dstCanvas.width = width;
    dstCanvas.height = height;
    //
    var dstImageData = dstCtx.createImageData(width, height);
    var dstData = dstImageData.data;
    //
    var spectrumPower = new Float32Array(nSample);
    for (var i = 0 ; i < nSample ; i++) {
	var s = Math.log(Math.sqrt(re[i]*re[i] + im[i]*im[i]));
	spectrumPower[i] = s;
    }
    if (maxSpectrumPower === null) {
	maxSpectrumPower = Math.max.apply(null, spectrumPower);
    }
    var i = 0;
    var normFactor = 255 / maxSpectrumPower;
    for (var y = 0; y < height; y++) {
	for (var x = 0; x < width; x++) {
	    var o = i << 2;
	    var val = spectrumPower[i] * normFactor;
	    dstData[o++] = (color===0)?val:(val-50);
	    dstData[o++] = (color===1)?val:(val-50);
	    dstData[o++] = (color===2)?val:(val-50);
	    dstData[o++] = 255;
	    i++;
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    return maxSpectrumPower;
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

function SpectrumFilter(spectrum, highPass, lowPass) {
    var [re, im] = spectrum;
    var nSample = re.length;
    var width = Math.sqrt(nSample);
    var height = width;
    var centerX = (width +1)/ 2, centerY = (height+1) / 2;
    var hypotenuse = Math.sqrt(width*width + height*height);
    var i = 0;
    for (var y = 0; y < height; y++) {
	for (var x = 0; x < width; x++) {
	    var dx = x - centerX;
	    var dy = y - centerY
	    var distance = Math.sqrt(dx*dx + dy*dy);
	    var ratio = distance / hypotenuse * 2;
	    if ((ratio < highPass) || (lowPass < ratio)) {
		re[i] = 0;
		im[i] = 0;
	    }
	    i++;
	}
    }
    return [re, im];
}

function drawFromDCT(dstCanvas, redSpectrum, greenSpectrum, blueSpectrum, keepContrast, srcCanvas) {
    var dstCtx = dstCanvas.getContext("2d");
    var nSample = redSpectrum[0].length;
    var width  = Math.sqrt(nSample);
    var height = width;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    var dstImageData = dstCtx.createImageData(width, height);
    var dstData = dstImageData.data;
    //
    var [reRed, imRed]     = redSpectrum;
    var [reGreen, imGreen] = greenSpectrum;
    var [reBlue, imBlue]   = blueSpectrum;
    FFT.init(width);
    swapQuadrant(reRed,   width, height);
    swapQuadrant(imRed,   width, height);
    FFT.ifft2d(reRed,   imRed);
    swapQuadrant(reGreen, width, height);
    swapQuadrant(imGreen, width, height);
    FFT.ifft2d(reGreen, imGreen);
    swapQuadrant(reBlue , width, height);
    swapQuadrant(imBlue , width, height)
    FFT.ifft2d(reBlue,  imBlue);
    //

    if (keepContrast) {
	var [srcMinRed, srcMaxRed, srcMinGreen, srcMaxGreen, srcMinBlue, srcMaxBlue] = getCanvasContrast(srcCanvas);
	var [dstMinRed, dstMaxRed] = getArrayContrast(reRed);
	var [dstMinGreen, dstMaxGreen] = getArrayContrast(reGreen);
	var [dstMinBlue, dstMaxBlue] = getArrayContrast(reBlue);
	var i = 0;
	var scaleRed   = (srcMaxRed - srcMinRed) / (dstMaxRed - dstMinRed);
	var scaleGreen = (srcMaxGreen - srcMinGreen) / (dstMaxGreen - dstMinGreen);
	var scaleBlue  = (srcMaxBlue - srcMinBlue) / (dstMaxBlue - dstMinBlue);
	var baseRed   = srcMinRed - dstMinRed;
	var baseGreen = srcMinGreen - dstMinGreen;
	var baseBlue  = srcMinBlue - dstMinBlue;
	for(var y = 0; y < height; y++) {
	    for(var x = 0; x < width; x++) {
		var o = i << 2;
		dstData[o++] = (reRed[i]   + baseRed)   * scaleRed;
		dstData[o++] = (reGreen[i] + baseGreen) * scaleGreen;
		dstData[o++] = (reBlue[i]  + baseBlue)  * scaleBlue;
		dstData[o++] = 255;
		i++;
	    }
	}
    } else {
	var i = 0;
	for(var y = 0; y < height; y++) {
	    for(var x = 0; x < width; x++) {
		var o = i << 2;
		dstData[o++] = reRed[i];
		dstData[o++] = reGreen[i];
		dstData[o++] = reBlue[i];
		dstData[o++] = 255;
		i++;
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

function drawFrom2NCanvas(dst2NCanvas, dstCanvas) {
    var dstCtx = dstCanvas.getContext("2d");
    dstCtx.drawImage(dst2NCanvas, 0, 0, dst2NCanvas.width, dst2NCanvas.height,
		     0, 0, dstCanvas.width, dstCanvas.height);
}

function getCanvasContrast(canvas) {
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var minRed = 255, minGreen = 255, minBlue = 255;
    var maxRed = 0, maxGreen = 0, maxBlue = 0;
    for (var i = 0, l = data.length ; i < l ; ) {
	var r = data[i++]
	var g = data[i++];
	var b = data[i++];
	i++; // a;
	if (r < minRed) {
	    minRed = r;
	} else if (maxRed < r) {
	    maxRed = r;
	}
	if (g < minGreen) {
	    minGreen = g;
	} else if (maxGreen < g) {
	    maxGreen = g;
	}
	if (b < minBlue) {
	    minBlue = b;
	} else if (maxBlue< b) {
	    maxBlue = b;
	}
    }
    return [minRed, maxRed, minGreen, maxGreen, minBlue, maxBlue];
}

function getArrayContrast(arr) {
    var min = 255, max = 0;
    for (var i = 0, l = arr.length ; i < l ; i++) {
	var v = arr[i];
	if (v < min) {
	    min = v;
	} else if (max < v) {
	    max = v;
	}
    }
    return [min, max];
}
