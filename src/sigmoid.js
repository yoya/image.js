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
    const gammaCanvas = document.getElementById('gammaCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const aRange = document.getElementById('aRange');
    const bRange = document.getElementById('bRange');
    const zRange = document.getElementById('zRange');
    const aText = document.getElementById('aText');
    const bText = document.getElementById('bText');
    const zText = document.getElementById('zText');
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'aRange':'aText',
'bRange':'bText',
'zRange':'zText',
		  'linearCheckbox':null
},
		 function(target, rel) {
		     // console.debug(target.id);
		     switch (target.id) {
		     case 'aRange':
		     case 'aText':
		     case 'bRange':
		     case 'bText':
			 zRange.value = 0;
			 zText.value = 0;
			 break;
		     case 'zRange':
		     case 'zText':
			 // -1.0
			 var z = parseFloat(zRange.value);
			 var a = Math.abs(z) * 50;
			 var b = z + 0.5;
			 aRange.value = a;
			 aText.value  = a;
			 bRange.value = b;
			 bText.value  = b;
			 break;
		     }
		     drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, rel);
		 });
    drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
}

function drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCancas, gammaCanvas, sync) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const a = parseFloat(document.getElementById('aRange').value);
    const b = parseFloat(document.getElementById('bRange').value);
    const linear = document.getElementById('linearCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSigmoidGraph(gammaCanvas, a, b);
    drawSigmoidImage(srcCanvas, dstCanvas, a, b, linear, sync);
}

function drawSigmoidGraph(gammaCanvas, a, b) {
    const ctx = gammaCanvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 256);
    ctx.lineTo(0, 256);
    const sig0 = sigmoid(0, a, b);
    const sig1 = sigmoid(1, a, b);
    for (let x = 0; x < 256; x++) {
	const v1 = x / 255;
	const v2 = (sigmoid(v1, a, b) - sig0) / (sig1 - sig0);
	const y = (1 - v2) * 255;
	ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

const worker = new workerProcess('worker/sigmoid.js');

function drawSigmoidImage(srcCanvas, dstCanvas, a, b, linear, sync) {
    // console.debug("drawSigmoidImage");
    const params = { a:a, b:b, linear:linear };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
