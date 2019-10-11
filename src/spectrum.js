'use strict';
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    const src2NCanvas = document.getElementById('src2NCanvas'); // 2^n size
    const dst2NCanvas = document.getElementById('dst2NCanvas'); // 2^n size
    const srcSpectrumRedCanvas   = document.getElementById('srcSpectrumRedCanvas');
    const srcSpectrumGreenCanvas = document.getElementById('srcSpectrumGreenCanvas');
    const srcSpectrumBlueCanvas  = document.getElementById('srcSpectrumBlueCanvas');
    const dstSpectrumRedCanvas   = document.getElementById('dstSpectrumRedCanvas');
    const dstSpectrumGreenCanvas = document.getElementById('dstSpectrumGreenCanvas');
    const dstSpectrumBlueCanvas  = document.getElementById('dstSpectrumBlueCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas,
					srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumBlueCanvas,
					dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
					dst2NCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'highPassRange':'highPassText',
		  'lowPassRange':'lowPassText',
		  'keepContrastCheckbox':null,
		  'floor2NCheckbox':null
},
		 function() {
	    drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas,
					srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumBlueCanvas,
					dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
					dst2NCanvas, dstCanvas);
		 });
}

function drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas,
				     srcSpectrumRedCanvas, srcSpectrumGreenCanvas, srcSpectrumblueCanvas,
				     dstSpectrumRedCanvas, dstSpectrumGreenCanvas, dstSpectrumBlueCanvas,
				     dst2NCanvas, dstCanvas) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const highPass = parseFloat(document.getElementById('highPassRange').value);
    const lowPass = parseFloat(document.getElementById('lowPassRange').value);
    const keepContrast = document.getElementById('keepContrastCheckbox').checked;
    const floor2N = document.getElementById('floor2NCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    draw2NCanvas(srcCanvas, src2NCanvas, floor2N);

    let [redSpectrum, greenSpectrum, blueSpectrum] = calcDCT(src2NCanvas);
    const maxRedSpectrumPower   = drawSpectrum(srcSpectrumRedCanvas,   redSpectrum,   null, 0);
    const maxGreenSpectrumPower = drawSpectrum(srcSpectrumGreenCanvas, greenSpectrum, null, 1);
    const maxBlueSpectrumPower  = drawSpectrum(srcSpectrumBlueCanvas,  blueSpectrum,  null, 2);
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
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width;
    const srcHeight = srcCanvas.height;
    let w = Math.log2(srcCanvas.width);
    let h = Math.log2(srcCanvas.height);
    if (floor2N) {
	w = Math.floor(w);
	h = Math.floor(h);
	var n = (w < h) ? w : h;
    } else {
	w = Math.ceil(w);
	h = Math.ceil(h);
	var n = (w > h) ? w : h;
    }
    const dstWidth = Math.pow(2, n);
    const dstHeight = dstWidth;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    dstCtx.drawImage(srcCanvas, 0, 0, srcWidth, srcHeight,
		     0, 0, dstWidth, dstHeight);
}

function calcDCT(srcCanvas) {
    // console.debug("calcDCT");
    const srcCtx = srcCanvas.getContext('2d');
    const width = srcCanvas.width; const height = srcCanvas.height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const srcData = srcImageData.data;
    //
    const nSample = width * height;
    const reRed   = new Float32Array(nSample);
    const imRed   = new Float32Array(nSample);
    const reGreen = new Float32Array(nSample);
    const imGreen = new Float32Array(nSample);
    const reBlue  = new Float32Array(nSample);
    const imBlue  = new Float32Array(nSample);
    let i = 0;
    for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
	    let o = i << 2;
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
    const [re, im] = spectrum;
    const dstCtx = dstCanvas.getContext('2d');
    const nSample = re.length;
    const width = Math.sqrt(nSample);
    const height = width;
    dstCanvas.width = width;
    dstCanvas.height = height;
    //
    const dstImageData = dstCtx.createImageData(width, height);
    const dstData = dstImageData.data;
    //
    const spectrumPower = new Float32Array(nSample);
    for (var i = 0; i < nSample; i++) {
	const s = Math.log(Math.sqrt(re[i] * re[i] + im[i] * im[i]));
	spectrumPower[i] = s;
    }
    if (maxSpectrumPower === null) {
        if (spectrumPower.length <  100) {
	    maxSpectrumPower = Math.max.apply(null, spectrumPower);
        } else {
            maxSpectrumPower = 0;
            for (var i = 0, n = spectrumPower.length; i < n; i++) {
                const p = spectrumPower[i];
                if (maxSpectrumPower < p) {
                    maxSpectrumPower = p;
                }
            }
        }
    }
    var i = 0;
    const normFactor = 255 / maxSpectrumPower;
    for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
	    let o = i << 2;
	    const val = spectrumPower[i] * normFactor;
	    dstData[o++] = (color === 0) ? val : (val - 50);
	    dstData[o++] = (color === 1) ? val : (val - 50);
	    dstData[o++] = (color === 2) ? val : (val - 50);
	    dstData[o++] = 255;
	    i++;
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    return maxSpectrumPower;
}

// 象限シフト
function swapQuadrant(data, width, height) {
    const nSample = width * height;
    const nSample_2 = nSample / 2;
    const nSample_3 = nSample * 3 / 4;
    const width_2 = width / 2; const height_2 = height / 2;
    let i, j;
    for (var y = 0; y < height_2; y++) {
	i = y * width;
	j = i + nSample_2 + width_2;
	for (var x = 0; x < width_2; x++) {
	    [data[i], data[j]] = [data[j], data[i]];
	    i++; j++;
	}
    }
    for (var y = 0; y < height_2; y++) {
	i = y * width + width_2;
	j = i + nSample_2 - width_2;
	for (var x = width_2; x < width; x++) {
	    [data[i], data[j]] = [data[j], data[i]];
	    i++; j++;
	}
    }
}

function SpectrumFilter(spectrum, highPass, lowPass) {
    const [re, im] = spectrum;
    const nSample = re.length;
    const width = Math.sqrt(nSample);
    const height = width;
    const centerX = (width + 1) / 2; const centerY = (height + 1) / 2;
    const hypotenuse = Math.sqrt(width * width + height * height);
    let i = 0;
    for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
	    const dx = x - centerX;
	    const dy = y - centerY;
	    const distance = Math.sqrt(dx * dx + dy * dy);
	    const ratio = distance / hypotenuse * 2;
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
    const dstCtx = dstCanvas.getContext('2d');
    const nSample = redSpectrum[0].length;
    const width  = Math.sqrt(nSample);
    const height = width;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const dstImageData = dstCtx.createImageData(width, height);
    const dstData = dstImageData.data;
    //
    const [reRed, imRed]     = redSpectrum;
    const [reGreen, imGreen] = greenSpectrum;
    const [reBlue, imBlue]   = blueSpectrum;
    FFT.init(width);
    swapQuadrant(reRed,   width, height);
    swapQuadrant(imRed,   width, height);
    FFT.ifft2d(reRed,   imRed);
    swapQuadrant(reGreen, width, height);
    swapQuadrant(imGreen, width, height);
    FFT.ifft2d(reGreen, imGreen);
    swapQuadrant(reBlue, width, height);
    swapQuadrant(imBlue, width, height);
    FFT.ifft2d(reBlue,  imBlue);
    //

    if (keepContrast) {
	const [srcMinRed, srcMaxRed, srcMinGreen, srcMaxGreen, srcMinBlue, srcMaxBlue] = getCanvasContrast(srcCanvas);
	const [dstMinRed, dstMaxRed] = getArrayContrast(reRed);
	const [dstMinGreen, dstMaxGreen] = getArrayContrast(reGreen);
	const [dstMinBlue, dstMaxBlue] = getArrayContrast(reBlue);
	var i = 0;
	const scaleRed   = (srcMaxRed - srcMinRed) / (dstMaxRed - dstMinRed);
	const scaleGreen = (srcMaxGreen - srcMinGreen) / (dstMaxGreen - dstMinGreen);
	const scaleBlue  = (srcMaxBlue - srcMinBlue) / (dstMaxBlue - dstMinBlue);
	const baseRed   = srcMinRed - dstMinRed;
	const baseGreen = srcMinGreen - dstMinGreen;
	const baseBlue  = srcMinBlue - dstMinBlue;
	for (var y = 0; y < height; y++) {
	    for (var x = 0; x < width; x++) {
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
	for (var y = 0; y < height; y++) {
	    for (var x = 0; x < width; x++) {
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
    const dstCtx = dstCanvas.getContext('2d');
    dstCtx.drawImage(dst2NCanvas, 0, 0, dst2NCanvas.width, dst2NCanvas.height,
		     0, 0, dstCanvas.width, dstCanvas.height);
}

function getCanvasContrast(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minRed = 255; let minGreen = 255; let minBlue = 255;
    let maxRed = 0; let maxGreen = 0; let maxBlue = 0;
    for (let i = 0, l = data.length; i < l;) {
	const r = data[i++];
	const g = data[i++];
	const b = data[i++];
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
	} else if (maxBlue < b) {
	    maxBlue = b;
	}
    }
    return [minRed, maxRed, minGreen, maxGreen, minBlue, maxBlue];
}

function getArrayContrast(arr) {
    let min = 255; let max = 0;
    for (let i = 0, l = arr.length; i < l; i++) {
	const v = arr[i];
	if (v < min) {
	    min = v;
	} else if (max < v) {
	    max = v;
	}
    }
    return [min, max];
}
