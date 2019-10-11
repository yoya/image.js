'use strict';
/*
 * 2017/04/23- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    const srcHistCanvas = document.getElementById('srcHistCanvas');
    const dstHistCanvas = document.getElementById('dstHistCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const equalizeCheckbox = document.getElementById('equalizeCheckbox');
    const equalizeRatioRange = document.getElementById('equalizeRatioRange');
    const equalizeRatioText  = document.getElementById('equalizeRatioText');
    const maxValueRange = document.getElementById('maxValueRange');
    const minValueRange = document.getElementById('minValueRange');
    const maxValueText = document.getElementById('maxValueText');
    const minValueText = document.getElementById('minValueText');
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'equalizeCheckbox':null,
		  'totalLineCheckbox':null,
                  'histogramCheckbox':null,
		  'equalizeRatioRange':'equalizeRatioText',
		  'maxValueRange':'maxValueText',
		  'minValueRange':'minValueText'
},
		 function(target) {
		     console.debug(target.id);
		     const maxValue = parseFloat(document.getElementById('maxValueRange').value);
		     const minValue = parseFloat(document.getElementById('minValueRange').value);
		     if (target.id === 'equalizeCheckbox')  {
			 if (equalizeCheckbox.checked) {
			     equalizeRatioRange.value = 255;
			     equalizeRatioText.value = 255;
			 } else {
			     equalizeRatioRange.value = 0;
			     equalizeRatioText.value = 0;
			 }
		     } else if ((target.id === 'equalizeRatioRange') ||
				(target.id === 'equalizeRatioText')) {
			 if (equalizeRatioRange.value == 0) {
			     equalizeCheckbox.checked = false;
			 } else {
			     equalizeCheckbox.checked = true;
			 }
		     } else {
			 if (minValue > maxValue) {
			     if ((target.id === 'maxValueRange') || (target.id === 'maxValueText')) {
				 minValueRange.value = maxValue;
				 minValueText.value  = maxValue;
			     } else if ((target.id === 'minValueRange') || (target.id === 'minValueText')) {
				 maxValueRange.value = minValue;
				 maxValueText.value  = minValue;
			     }
			 }
		     }
		     drawSrcImageAndHistogram(srcImage, srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas);
		 });
}

function drawSrcImageAndHistogram(srcImage, srcCanvas, dstCancas, srcHistCanvas, dstHistCanvas) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const equalizeRatio = parseFloat(document.getElementById('equalizeRatioRange').value);
    const maxValue = parseFloat(document.getElementById('maxValueRange').value);
    const minValue = parseFloat(document.getElementById('minValueRange').value);
    const totalLine = document.getElementById('totalLineCheckbox').checked;
    const histogram = document.getElementById('histogramCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalizeRatio, minValue, maxValue, totalLine, histogram);
}

function levelAdjustment(v, srcMinValue, srcMaxValue, dstMinValue, dstMaxValue) {
    if (v < srcMinValue) {
	return dstMinValue;
    } else if (srcMaxValue < v) {
	return dstMaxValue;
    }
    return dstMaxValue * (v - srcMinValue) / (srcMaxValue - srcMinValue) + dstMinValue;
}

function equalizeMap(redHist, greenHist, blueHist, minValue, maxValue) {
    const map = new Uint8Array(256);
    const hist = new Uint32Array(256).map(function(n, i) {
	if ((i < minValue) || (maxValue < i)) {
	    return 0;
	}
	return redHist[i] + greenHist[i] + blueHist[i];
    });
    const nColors = hist.reduce(function(prev, cur) { return prev + cur; });
    let count = 0;
    for (let i = 0; i < 256; i++) {
	if (i <= minValue) {
	    map[i] = 0;
	} else if (maxValue <= i) {
	    map[i] = 255;
	} else {
	    const c = hist[i];
	    if (c > 0) {
		count += c;
		map[i] = 255; // fail safe
		for (let j = 0; j < 256; j++) {
		    if (count <= (nColors / (maxValue - minValue) * (j - minValue + 1))) {
			const v = levelAdjustment(j, minValue, maxValue, 0, 255);
			map[i] = Math.round(v);
			break;
		    }
		}
	    }
	}
    }
    return map;
}

function drawHistogram(srcCanvas, dstCanvas, srcHistCanvas, dstHistCanvas, equalizeRatio, minValue, maxValue, totalLine, histogram) {
    // console.debug("drawHistogram");
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    const dstWidth  = srcWidth;
    const dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var redHist   = getColorHistogramList(srcCanvas, 'red');
    var greenHist = getColorHistogramList(srcCanvas, 'green');
    var blueHist  = getColorHistogramList(srcCanvas, 'blue');
    drawHistgramGraph(srcHistCanvas, redHist, greenHist, blueHist, minValue, maxValue, totalLine, histogram);
    if (equalizeRatio) {
	var colorMap = equalizeMap(redHist, greenHist, blueHist, minValue, maxValue);
    } else if ((minValue > 0) || (maxValue < 255)) {
	var colorMap = new Uint8Array(256).map(function(n, i) {
	    const v = levelAdjustment(i, minValue, maxValue, 0, 255);
	    return Math.round(v);
	});
    } else {
	var colorMap = new Uint8Array(256).map(function(n, i) { return i; });
    }
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX = dstX;
	    const srcY = dstY;
	    let [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
	    if ((equalizeRatio === 0) || (equalizeRatio === 255)) {
		setRGBA(dstImageData, dstX, dstY, [colorMap[r], colorMap[g],
						   colorMap[b], a]);
	    } else {
		const ra = levelAdjustment(r, minValue, maxValue, 0, 255);
		const ga = levelAdjustment(g, minValue, maxValue, 0, 255);
		const ba = levelAdjustment(b, minValue, maxValue, 0, 255);
		r = (ra * (255 - equalizeRatio) + colorMap[r] * equalizeRatio) / 255;
		g = (ga * (255 - equalizeRatio) + colorMap[g] * equalizeRatio) / 255;
		b = (ba * (255 - equalizeRatio) + colorMap[b] * equalizeRatio) / 255;
		setRGBA(dstImageData, dstX, dstY, [Math.round(r), Math.round(g), Math.round(b), a]);
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    //
    var redHist   = getColorHistogramList(dstCanvas, 'red');
    var greenHist = getColorHistogramList(dstCanvas, 'green');
    var blueHist  = getColorHistogramList(dstCanvas, 'blue');
    drawHistgramGraph(dstHistCanvas, redHist, greenHist, blueHist, 0, 255, totalLine, histogram);
}
