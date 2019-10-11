'use strict';
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas1 = document.getElementById('srcCanvas1');
    const srcCanvas2 = document.getElementById('srcCanvas2');
    const srcCanvas1Container = document.getElementById('srcCanvas1Container');
    const srcCanvas2Container = document.getElementById('srcCanvas2Container');
    const dstCanvas = document.getElementById('dstCanvas');
    let maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    let srcImage1 = new Image(srcCanvas1.width, srcCanvas1.height);
    let srcImage2 = new Image(srcCanvas2.width, srcCanvas2.height);

    dropFunction(srcCanvas1Container, function(dataURL) {
	srcImage1 = new Image();
	srcImage1.onload = function() {
	    drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
	    drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
	};
	srcImage1.src = dataURL;
    }, 'DataURL');
    dropFunction(srcCanvas2Container, function(dataURL) {
	srcImage2 = new Image();
	srcImage2.onload = function() {
	    drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
	    drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
	};
	srcImage2.src = dataURL;
    }, 'DataURL');

    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		 'normalizeCheckbox':null
},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
		     drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
		     drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
		 });
    bindFunction({ 'methodSelect':null },
		 function() {
		     drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
		 });
}

function drawDiff(srcCanvas1, srcCanvas2, dstCanvas) {
    // console.debug("drawDiff")
    const normalize = document.getElementById('normalizeCheckbox').checked;
    const method = document.getElementById('methodSelect').value;
    const srcCtx1 = srcCanvas1.getContext('2d');
    const srcCtx2 = srcCanvas2.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth1 = srcCanvas1.width; const srcHeight1 = srcCanvas1.height;
    const srcWidth2 = srcCanvas2.width; const srcHeight2 = srcCanvas2.height;
    const dstWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    const dstHeight = (srcHeight1 < srcHeight2) ? srcHeight1 : srcHeight2;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData1 = srcCtx1.getImageData(0, 0, srcWidth1, srcHeight1);
    const srcImageData2 = srcCtx2.getImageData(0, 0, srcWidth2, srcHeight2);

    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);

    const nSample4 = dstWidth * dstHeight * 4;
    const tmpImageData = { width:dstWidth, data:new Float32Array(nSample4) };

    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX1 = dstX; const srcY1 = dstY;
	    const srcX2 = dstX; const srcY2 = dstY;
	    const [r1, g1, b1, a1] = getRGBA(srcImageData1, srcX1, srcY1);
	    const [r2, g2, b2, a2] = getRGBA(srcImageData2, srcX2, srcY2);
	    const [rdiff, gdiff, bdiff] = [Math.abs(r2 - r1), Math.abs(g2 - g1), Math.abs(b2 - b1)];
	    const [rmse, gmse, bmse] = [rdiff * rdiff, gdiff * gdiff, bdiff * bdiff];
	    var rgba;
	    switch (method) {
	    case 'ae':
		rgba = [rdiff, gdiff, bdiff, 255];
		break;
	    case 'mse':
		rgba = [rmse / 255, gmse / 255, bmse / 255, 255];
		break;
	    case 'psnr':
		rgba = [20 * Math.log10(255) - 10 * Math.log10(rmse),
			20 * Math.log10(255) - 10 * Math.log10(gmse),
			20 * Math.log10(255) - 10 * Math.log10(bmse),
			255];
		break;
	    default:
		console.error('unknown method:' + method);
		break;
	    }
	    setRGBA(tmpImageData, dstX, dstY, rgba);
	}
    }
    if (normalize) {
	let maxLuminance = 0;
	for (var i = 0; i < nSample4; i += 4) {
	    const luminance = (3 * tmpImageData.data[i] + 6 * tmpImageData.data[i + 1] + tmpImageData.data[i + 2]) / 10;
	    if ((luminance  > maxLuminance) && (luminance !== Infinity)) {
		maxLuminance = luminance;
	    }
	}
	console.debug('maxLuminance:' + maxLuminance);
	for (var i = 0; i < nSample4; i += 4) {
	    for (let j = 0; j < 3; j++) {
		if ((maxLuminance !== 0) ||
		    (maxLuminance !== Infinity)) {
		    tmpImageData.data[i + j]   *= 255 / maxLuminance;
		}
		if ((tmpImageData.data[i + j] > 255) ||
		    (tmpImageData.data[i + j] === Infinity)) {
		    tmpImageData.data[i + j] = 255;
		}
	    }
	}
    }
    for (var i = 0; i < nSample4; i++) {
	dstImageData.data[i] = Math.floor(tmpImageData.data[i]);
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
