'use strict';
/*
 * 2018/10/08- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const canvas = document.getElementById('canvas');
    const widthRange  = document.getElementById('widthRange');
    const heightRange = document.getElementById('heightRange');
    const thetaRange = document.getElementById('thetaRange');
    const revRedCheckbox = document.getElementById('revRedCheckbox');
    const revGreenCheckbox = document.getElementById('revGreenCheckbox');
    const revBlueCheckbox = document.getElementById('revBlueCheckbox');
    const scaleRange = document.getElementById('scaleRange');
    const params = {
	'width':  parseFloat(widthRange.value),
	'height': parseFloat(heightRange.value),
	'theta': parseFloat(thetaRange.value),
	'revRed':  revRedCheckbox.checked,
	'revGreen':revGreenCheckbox.checked,
	'revBlue': revBlueCheckbox.checked,
	'scale': parseFloat(scaleRange.value)
    };
    bindFunction({
 'widthRange':'widthText',
		  'heightRange':'heightText',
		  'thetaRange':'thetaText',
		  'revRedCheckbox':null,
		  'revGreenCheckbox':null,
		  'revBlueCheckbox':null,
		  'scaleRange':'scaleText'
},
		 function() {
		     params.width  = parseFloat(widthRange.value);
		     params.height = parseFloat(heightRange.value);
		     params.theta = parseFloat(thetaRange.value);
		     params.revRed   = revRedCheckbox.checked;
		     params.revGreen = revGreenCheckbox.checked;
		     params.revBlue  = revBlueCheckbox.checked;
		     params.scale = parseFloat(scaleRange.value);
		     drawCZP(canvas, params);
		 });
    drawCZP(canvas, params);
}

// http://wazalabo.com/scaling4.html
function drawCZP(canvas, params) {
    // console.debug("drawCZP");
    const ctx = canvas.getContext('2d');
    const width  = params.width;
    const height = params.height;
    const theta = params.theta;
    const revRed   = params.revRed;
    const revGreen = params.revGreen;
    const revBlue  = params.revBlue;
    const scale = params.scale;
    canvas.width  = width;
    canvas.height = height;
    //
    const imageData = ctx.createImageData(width, height);
    const cx = Math.PI / width / 2  / scale;
    const cy = Math.PI / height / 2 / scale;
    const t = theta * (2 * Math.PI) / 360;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    const xx = (x - width / 2);
	    const yy = (y - height / 2);
	    const v = 128 * Math.sin(t + cx * xx * xx + cy * yy * yy) + 128;
	    const rgba = [v, v, v, 255];
	    const red   = (revRed) ? (255 - v) : v;
	    const green = (revGreen) ? (255 - v) : v;
	    const blue  = (revBlue) ? (255 - v) : v;
	    setRGBA(imageData, x, y, [red, green, blue, 255]);
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
