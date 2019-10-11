'use strict';
/*
 * 2017/03/17- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorReduction(srcImage, srcCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'quantizeMethod':null
},
		 function() {
		     drawSrcImageAndColorReduction(srcImage, srcCanvas);
		 });
}

let worker = null;

function drawSrcImageAndColorReduction(srcImage, srcCanvas) {
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const quantizeMethod = document.getElementById('quantizeMethod').value;
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    document.getElementById('nColorSrc').value = '';
    document.getElementById('nColorDst').value = '';
    var srcImageData = srcCanvas.getContext('2d').getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var srcImageData = srcCtx.getImageData(0, 0, srcCanvas.width,
					   srcCanvas.height);
    document.getElementById('nColorSrc').value = getColorNum(srcImageData);

    if (worker) {
	worker.terminate();
    }
    const div = loadingStart();
    worker = new Worker('worker/colorreduction.js');
    worker.onmessage = function(e) {
	const [dstImageData, palette] = [e.data.image, e.data.palette];
	const dstWidth = dstImageData.width;
	const dstHeight = dstImageData.height;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	dstCtx.putImageData(dstImageData, 0, 0, 0, 0, dstWidth, dstHeight);
	//
	const paletteCanvas = document.getElementById('paletteCanvas');
	drawPalette(paletteCanvas, palette);
	document.getElementById('nColorDst').value = getColorNum(dstImageData);
	loadingEnd(div);
	worker = null;
    };
    worker.postMessage({ image:srcImageData, method:quantizeMethod },
		       [srcImageData.data.buffer]);
}
