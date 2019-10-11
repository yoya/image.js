'use strict';
/*
 * 2018/11/10- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

// https://www.w3.org/TR/filter-effects/#sepiaEquivalent
function sepiaToneMatrix(amount) {
    const a = 1 - amount;
    const colorMatrix = [
	(0.393 + 0.607 * a), (0.769 - 0.769 * a), (0.189 - 0.189 * a), 0,
        (0.349 - 0.349 * a), (0.686 + 0.314 * a), (0.168 - 0.168 * a), 0,
        (0.272 - 0.272 * a), (0.534 - 0.534 * a), (0.131 + 0.869 * a), 0];
    return colorMatrix;
}

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    const colorMatrixTable = document.getElementById('colorMatrixTable');
    const amountRange = document.getElementById('amountRange');
    let amount = parseFloat(amountRange.value);
    let colorMatrix = sepiaToneMatrix(amount);
    const colorWindow = 4;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    //
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'linearCheckbox':null
},
		 function() {
		     drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
		 });
    bindFunction({ 'amountRange':'amountText' },
		 function() {
		     amount = parseFloat(amountRange.value);
		     colorMatrix = sepiaToneMatrix(amount);
		     setTableValues('colorMatrixTable', colorMatrix);
		     drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
		 });
    //
    bindTableFunction('colorMatrixTable', function(table, values, width) {
	colorMatrix = values;
	drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, colorMatrix);
    }, colorMatrix, colorWindow);
    console.log(colorMatrixTable);
}

function drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCancas, colorMatrix) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const linear = document.getElementById('linearCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSepiaTone(srcCanvas, dstCanvas, colorMatrix, linear);
}

function colorTransform(rgb, mat) {
    const [r, g, b] = rgb;
    const r2 = r * mat[0] + g * mat[1] + b * mat[2]  + 255 * mat[3];
    const g2 = r * mat[4] + g * mat[5] + b * mat[6]  + 255 * mat[7];
    const b2 = r * mat[8] + g * mat[9] + b * mat[10] + 255 * mat[11];
    return [r2, g2, b2];
}

function sepiaTone(rgba, colorMatrix, linear) {
    let [r, g, b, a] = rgba;
    if (linear) {
	[r, g, b] = sRGB2linearRGB([r, g, b]);
	r *= 255; g *= 255; b *= 255;
    }
    [r, g, b] = colorTransform([r, g, b], colorMatrix);
    if (linear) {
	r /= 255; g /= 255; b /= 255;
	[r, g, b] = linearRGB2sRGB([r, g, b]);
    }
    return [r, g, b, a];
}

function drawSepiaTone(srcCanvas, dstCanvas, colorMatrix, linear) {
    // console.debug("drawSepiaTone");
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const width = srcCanvas.width; const height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    let rgba = getRGBA(srcImageData, x, y);
	    rgba = sepiaTone(rgba, colorMatrix, linear);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
