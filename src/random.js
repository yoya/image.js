'use strict';
/*
 * 2017/05/21- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const canvas = document.getElementById('canvas');
    let image = new Image(canvas.width, canvas.height);
    let offCanvas = null;
    const histCanvas = document.getElementById('histCanvas');
    const widthRange = document.getElementById('widthRange');
    const heightRange = document.getElementById('heightRange');
    let maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
        dropFunction(document, function(dataURL) {
	    image = new Image();
	    image.onload = function() {
		offCanvas = document.createElement('canvas');
		offCanvas.id = 'offCanvas';
		drawSrcImage(image, offCanvas, maxWidthHeight);
		const width = parseFloat(offCanvas.width);
		const height = parseFloat(offCanvas.height);
		widthRange.value = widthText.value = width;
		heightRange.value = heightText.value = height;
		drawRandomAndHistogram(canvas, offCanvas, histCanvas);
	    };
	    image.src = dataURL;
	}, 'DataURL');
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(image, offCanvas, maxWidthHeight);
		     const width = parseFloat(offCanvas.width);
		     const height = parseFloat(offCanvas.height);
		     widthRange.value = widthText.value = width;
		     heightRange.value = heightText.value = height;
		     drawRandomAndHistogram(canvas, offCanvas, histCanvas);
		 });
    bindFunction({
'refreshButton':null,
		  'animationButton':null,
		  'ejectButton':null,
		  'widthRange':'widthText',
		  'heightRange':'heightText',
		  'redRatioRange':'redRatioText',
		  'greenRatioRange':'greenRatioText',
		  'blueRatioRange':'blueRatioText',
		  'ampRange':'ampText',
                  'offsetRange':'offsetText',
		  'densityRange':'densityText'
},
		 function(target) {
                     const ampRange = document.getElementById('ampRange');
                     const ampText = document.getElementById('ampText');
                     const offsetRange = document.getElementById('offsetRange');
                     const offsetText = document.getElementById('offsetText');
                     const amp = parseFloat(ampRange.value);
                     const offset = parseFloat(document.getElementById('offsetRange').value);
	             if (target.id === 'ampRange') {
                         if ((offset + amp) > 1) {
                             offsetRange.value = offsetText.value = 1 - amp;
                         }
                     }
                     if (target.id === 'offsetRange') {
                         if ((offset + amp) > 1) {
                             ampRange.value = ampText.value = 1 - offset;
                         }
                     }
		     if (target.id === 'ejectButton') {
			 offCanvas = null;
		     }
		     if (target.id === 'animationButton') {
			 animetionRandomAndHistogram(canvas, offCanvas, histCanvas);
		     }
		     drawRandomAndHistogram(canvas, offCanvas, histCanvas);
		 });
    drawRandomAndHistogram(canvas, offCanvas, histCanvas);
}

let anim_id = null;
function animetionRandomAndHistogram(canvas, offCanvas, histCanvas) {
    const Context = function() {
	this.canvas = canvas;
	this.offCanvas = offCanvas;
	this.histCanvas =  histCanvas;
    };
    const ctx = new Context();
    if (anim_id === null) {
	anim_id = setInterval(animetionRandomAndHistogram_.bind(ctx), 10);
    } else {
	clearInterval(anim_id);
	anim_id = null;
    }
}

function animetionRandomAndHistogram_() {
    const canvas = this.canvas;
    const offCanvas = this.offCanvas;
    const histCanvas = this.histCanvas;
    drawRandomAndHistogram(canvas, offCanvas, histCanvas);
}

function drawRandomAndHistogram(canvas, offCanvas, histCanvas) {
    if (anim_id !== null) {
	animetionRandomAndHistogram(canvas, offCanvas, histCanvas);
	animetionRandomAndHistogram(canvas, offCanvas, histCanvas);
    }
    const width = parseInt(document.getElementById('widthRange').value, 10);
    const height = parseInt(document.getElementById('heightRange').value, 10);
    const redRatio = parseFloat(document.getElementById('redRatioRange').value);
    const greenRatio = parseFloat(document.getElementById('greenRatioRange').value);
    const blueRatio = parseFloat(document.getElementById('blueRatioRange').value);
    const amp = parseFloat(document.getElementById('ampRange').value);
    const offset = parseFloat(document.getElementById('offsetRange').value);
    const density = parseFloat(document.getElementById('densityRange').value);
    drawRandom(canvas, offCanvas, width, height, redRatio, greenRatio, blueRatio, amp, offset, density);
    const redHist   = getColorHistogramList(canvas, 'red');
    const greenHist = getColorHistogramList(canvas, 'green');
    const blueHist  = getColorHistogramList(canvas, 'blue');
    drawHistgramGraph(histCanvas, redHist, greenHist, blueHist, 0, 255, false);
}

function randomValue(ratio) {
    let v = Math.random();       // 0   <= v < 1
    const r = Math.random() - 0.5; // 0.5 <= r < 0.5
    v = Math.sqrt(v);
    if (ratio < r) {
	v = 1 - v;
    }
    if (ratio < -0.5) {
	v = v * (ratio + 1.5);
    } else if (ratio > 0.5) {
	v = v * (1.5 - ratio) + (ratio - 0.5);
    }
    return v;
}

function randomRGBA(redRatio, greenRatio, blueRatio) {
    const r = randomValue(redRatio);
    const g = randomValue(greenRatio);
    const b = randomValue(blueRatio);
    return [Math.floor(r * 256),
	    Math.floor(g * 256),
	    Math.floor(b * 256), 255];
}

function drawRandom(canvas, offCanvas, width, height, redRatio, greenRatio, blueRatio, amp, offset, density) {
    // console.debug("drawRandom");
    const ctx = canvas.getContext('2d');
    canvas.width  = width;
    canvas.height = height;
    //
    const imageData = ctx.createImageData(width, height);
    if (offCanvas === null) {
	for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
		if (Math.random() < 1 / density) {
		    const [r, g, b] = randomRGBA(redRatio, greenRatio, blueRatio);
                    const o = offset * 255;
		    var rgba = [o + amp * r,  o + amp * g, o + amp * b, 255];
		    setRGBA(imageData, x, y, rgba);
		}
	    }
	}
    } else {
	const offCtx = offCanvas.getContext('2d');
	const offImageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
	for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
		if (Math.random() < 1 / density) {
		    const [r1, g1, b1, a1] = getRGBA(offImageData, x, y, 'edge');
		    const [r2, g2, b2] = randomRGBA(redRatio, greenRatio, blueRatio);
		    var rgba = [r1 + amp * 2 * (r2 - 127),  g1 + amp * 2 * (g2 - 127), b1 + amp * 2 * (b2 - 127), a1];
		} else {
		    var rgba = getRGBA(offImageData, x, y, 'edge');
		}
		setRGBA(imageData, x, y, rgba);
	    }
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
