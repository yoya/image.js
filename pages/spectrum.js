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
    var srcSpectrumRedCanvas   = document.getElementById("srcSpectrumRedCanvas");
    var srcSpectrumGreenCanvas = document.getElementById("srcSpectrumGreenCanvas");
    var srcSpectrumBlueCanvas  = document.getElementById("srcSpectrumBlueCanvas");
    var dstSpectrumRedCanvas   = document.getElementById("dstSpectrumRedCanvas");
    var dstSpectrumGreenCanvas = document.getElementById("dstSpectrumGreenCanvas");
    var dstSpectrumBlueCanvas  = document.getElementById("dstSpectrumBlueCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSpectrumAndFilter(srcImage, srcCanvas,
					     srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumBlueCanvas,
					     dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
					     dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
	drawSrcImageAndSpectrumAndFilter(srcImage, srcCanvas,
					 srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumBlueCanvas,
					 dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
					 dstCanvas, params);
    }, {keys: ["maxWidthHeight", "highPass", "lowPass", "keepContrast"]});
}

function drawSrcImageAndSpectrumAndFilter(srcImage, srcCanvas,
					  srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumBlueCanvas,
					  dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
					  dstCanvas, params) {
    var { maxWidthHeight, highPass, lowPass, keepContrast } = params;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var width = srcCanvas.width, height = srcCanvas.height;
    var fft = new FFT2D(width, height);
    var [redSpectrum, greenSpectrum, blueSpectrum] = calcSpectrum(srcCanvas, fft);
    var maxRedSpectrumPower   = drawSpectrum(srcSpectrumRedCanvas,   redSpectrum,   width, height, null, 0);
    var maxGreenSpectrumPower = drawSpectrum(srcSpectrumGreenCanvas, greenSpectrum, width, height, null, 1);
    var maxBlueSpectrumPower  = drawSpectrum(srcSpectrumBlueCanvas,  blueSpectrum,  width, height, null, 2);
    SpectrumFilter(redSpectrum,   width, height, highPass, lowPass);
    SpectrumFilter(greenSpectrum, width, height, highPass, lowPass);
    SpectrumFilter(blueSpectrum,  width, height, highPass, lowPass);
    drawSpectrum(dstSpectrumRedCanvas,   redSpectrum,   width, height, maxRedSpectrumPower,   0);
    drawSpectrum(dstSpectrumGreenCanvas, greenSpectrum, width, height, maxGreenSpectrumPower, 1);
    drawSpectrum(dstSpectrumBlueCanvas,  blueSpectrum,  width, height, maxBlueSpectrumPower,  2);
    drawFromSpectrum(dstCanvas, fft, redSpectrum, greenSpectrum, blueSpectrum, keepContrast, srcCanvas);
}

// 直流成分を中央 (floor(width/2), floor(height/2)) にしたスペクトルを返す
function calcSpectrum(srcCanvas, fft) {
    var srcCtx = srcCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    var srcData = srcCtx.getImageData(0, 0, width, height).data;
    var nSample = width * height;
    var red   = new Float64Array(nSample);
    var green = new Float64Array(nSample);
    var blue  = new Float64Array(nSample);
    for (var i = 0, o = 0; i < nSample; i++, o += 4) {
	red[i]   = srcData[o];
	green[i] = srcData[o + 1];
	blue[i]  = srcData[o + 2];
    }
    // R と G は 1 回の複素 FFT にまとめる
    var [redSpectrum, greenSpectrum] = fft.forwardReal2(red, green);
    var blueSpectrum = [blue, new Float64Array(nSample)];
    fft.forward(blueSpectrum[0], blueSpectrum[1]);
    for (var spectrum of [redSpectrum, greenSpectrum, blueSpectrum]) {
	FFT2D.shift(spectrum[0], width, height);
	FFT2D.shift(spectrum[1], width, height);
    }
    return [redSpectrum, greenSpectrum, blueSpectrum];
}

function drawSpectrum(dstCanvas, spectrum, width, height, maxSpectrumPower, color) {
    var [re, im] = spectrum;
    var dstCtx = dstCanvas.getContext("2d");
    var nSample = width * height;
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
        maxSpectrumPower = 0;
        for (var i = 0 ; i < nSample ; i++) {
            var p = spectrumPower[i]
            if (maxSpectrumPower < p) {
                maxSpectrumPower = p;
            }
        }
    }
    var normFactor = 255 / maxSpectrumPower;
    for (var i = 0, o = 0; i < nSample; i++) {
	var val = spectrumPower[i] * normFactor;
	dstData[o++] = (color===0)?val:(val-50);
	dstData[o++] = (color===1)?val:(val-50);
	dstData[o++] = (color===2)?val:(val-50);
	dstData[o++] = 255;
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    return maxSpectrumPower;
}

// 直流成分からの距離でマスクする。中心を直流成分に合わせて、マスクを点対称にする。
function SpectrumFilter(spectrum, width, height, highPass, lowPass) {
    var [re, im] = spectrum;
    var centerX = width >> 1, centerY = height >> 1;
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
}

function drawFromSpectrum(dstCanvas, fft, redSpectrum, greenSpectrum, blueSpectrum, keepContrast, srcCanvas) {
    var width = fft.width, height = fft.height;
    var dstCtx = dstCanvas.getContext("2d");
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    var dstImageData = dstCtx.createImageData(width, height);
    var dstData = dstImageData.data;
    //
    for (var spectrum of [redSpectrum, greenSpectrum, blueSpectrum]) {
	FFT2D.unshift(spectrum[0], width, height);
	FFT2D.unshift(spectrum[1], width, height);
    }
    var [reRed, reGreen] = fft.inverseReal2(redSpectrum[0], redSpectrum[1],
					    greenSpectrum[0], greenSpectrum[1]);
    var [reBlue, imBlue] = blueSpectrum;
    fft.inverse(reBlue, imBlue);
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
