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
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'addRedRange':'addRedText',
'addGreenRange':'addGreenText',
'addBlueRange':'addBlueText',
		  'multiRedRange':'multiRedText',
'multiGreenRange':'multiGreenText',
'multiBlueRange':'multiBlueText',
		  'sigmoidRedRange':'sigmoidRedText',
'sigmoidGreenRange':'sigmoidGreenText',
'sigmoidBlueRange':'sigmoidBlueText'
},
		 function() {
		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas);
		 });
}
function drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCancas) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    const addRed    = parseFloat(document.getElementById('addRedRange').value);
    const addGreen  = parseFloat(document.getElementById('addGreenRange').value);
    const addBlue   = parseFloat(document.getElementById('addBlueRange').value);
    const multiRed    = parseFloat(document.getElementById('multiRedRange').value);
    const multiGreen  = parseFloat(document.getElementById('multiGreenRange').value);
    const multiBlue   = parseFloat(document.getElementById('multiBlueRange').value);
    const sigmoidRed    = parseFloat(document.getElementById('sigmoidRedRange').value);
    const sigmoidGreen  = parseFloat(document.getElementById('sigmoidGreenRange').value);
    const sigmoidBlue   = parseFloat(document.getElementById('sigmoidBlueRange').value);
    drawColorTransform(srcCanvas, dstCanvas,
		       addRed, addGreen, addBlue,
		       multiRed, multiGreen, multiBlue,
		       sigmoidRed, sigmoidGreen, sigmoidBlue);
}

function drawColorTransform(srcCanvas, dstCanvas,
			    addRed, addGreen, addBlue,
			    multiRed, multiGreen, multiBlue,
			    sigmoidRed, sigmoidGreen, sigmoidBlue) {
    // console.debug("drawColorTransform");
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
    // -1.0 ~ 0 ~ 1.0 => 50 ~ 0 ~ 50
    const sig_A_red   = Math.abs(sigmoidRed)   * 50;
    const sig_A_green = Math.abs(sigmoidGreen) * 50;
    const sig_A_blue  = Math.abs(sigmoidBlue)  * 50;
    // -1.0 ~ 1.0 => -0.5 ~ 1.5
    const sig_B_red   = 0.5 - sigmoidRed;
    const sig_B_green = 0.5 - sigmoidGreen;
    const sig_B_blue  = 0.5 - sigmoidBlue;
    const sig0_red   = sigmoid(0.0, sig_A_red,   sig_B_red);
    const sig1_red   = sigmoid(1.0, sig_A_red,   sig_B_red);
    const sig0_green = sigmoid(0.0, sig_A_green, sig_B_green);
    const sig1_green = sigmoid(1.0, sig_A_green, sig_B_green);
    const sig0_blue  = sigmoid(0.0, sig_A_blue,  sig_B_blue);
    const sig1_blue  = sigmoid(1.0, sig_A_blue,  sig_B_blue);
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX = dstX;
	    const srcY = dstY;
	    let [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
	    r = r * multiRed   + addRed;
	    g = g * multiGreen + addGreen;
	    b = b * multiBlue  + addBlue;
	    if (sigmoidRed) {
		r /= 255;
		r = (sigmoid(r, sig_A_red, sig_B_red) - sig0_red) /
		    (sig1_red - sig0_red);
		r *= 255;
	    }
	    if (sigmoidGreen) {
		g /= 255;
		g = (sigmoid(g, sig_A_green, sig_B_green) - sig0_green) /
		    (sig1_green - sig0_green);
		g *= 255;
	    }
	    if (sigmoidBlue) {
		b /= 255;
		b = (sigmoid(b, sig_A_blue, sig_B_blue) - sig0_blue) /
		    (sig1_blue - sig0_blue);
		b *= 255;
	    }
	    const rgba = [r, g, b, a];
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
