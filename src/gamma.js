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
    const gammaCanvas = document.getElementById('gammaCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const gammaRange = document.getElementById('gammaRange');
    const gammaText = document.getElementById('gammaText');
    const gammaReciprocalRange = document.getElementById('gammaReciprocalRange');
    const gammaReciprocalText = document.getElementById('gammaReciprocalText');
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'gammaRange':'gammaText',
		  'gammaReciprocalRange':'gammaReciprocalText',
                  'RCheckbox':null,
'GCheckbox':null,
'BCheckbox':null
},
		 function(target, rel) {
		     console.debug(target.id);
		     if ((target.id === 'gammaRange') || (target.id === 'gammaText')) {
			 gammaReciprocalRange.value = 1.0 / parseFloat(gammaRange.value);
			 gammaReciprocalText.value = gammaReciprocalRange.value;
		     } else if ((target.id === 'gammaReciprocalRange') || (target.id === 'gammaReciprocalText')) {
			 gammaRange.value = 1.0 / parseFloat(gammaReciprocalRange.value);
			 gammaText.value = gammaRange.value;
		     }
		     drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, rel);
		 });
    gammaReciprocalRange.value = 1.0 / parseFloat(gammaRange.value);
    gammaReciprocalText.value = gammaReciprocalRange.value;
    drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
}

function drawSrcImageAndGamma(srcImage, srcCanvas, dstCancas, gammaCanvas, sync) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const gamma = parseFloat(document.getElementById('gammaRange').value);
    const R = document.getElementById('RCheckbox').checked;
    const G = document.getElementById('GCheckbox').checked;
    const B = document.getElementById('BCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGammaGraph(gammaCanvas, gamma);
    const params = {
        RGamma: R ? gamma : 1.0,
        GGamma: G ? gamma : 1.0,
        BGamma: B ? gamma : 1.0
    };
    drawGammaImage(srcCanvas, dstCanvas, params, sync);
}

function drawGammaGraph(gammaCanvas, gamma) {
    const ctx = gammaCanvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 256);
    ctx.lineTo(0, 256);
    for (let x = 0; x < 256; x++) {
	const v1 = x / 255;
    	const v2 = Math.pow(v1, gamma);
	const y = (1 - v2) * 255;
	ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

const worker = new workerProcess('worker/gamma.js');

function drawGammaImage(srcCanvas, dstCanvas, params, sync) {
    // console.debug("drawGammaImage");
    worker.process(srcCanvas, dstCanvas, params, sync);
}
