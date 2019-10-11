'use strict';
/*
 * 2017/06/15- (c) yoya@awm.jp
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
	    drawSrcImageAndMoment(srcImage, srcCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'reverseCheckbox':null
},
		 function() {
		     drawSrcImageAndMoment(srcImage, srcCanvas, dstCanvas);
		 });
}
function drawSrcImageAndMoment(srcImage, srcCanvas, dstCancas) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    const reverse = document.getElementById('reverseCheckbox').checked;
    drawGrayImage(srcCanvas, dstCanvas);
    drawMoment(dstCanvas, reverse);
}

function drawMoment(canvas, reverse) {
    // console.debug("drawMoment");
    const ctx = canvas.getContext('2d');
    const M00Text = document.getElementById('M00Text');
    const M10Text = document.getElementById('M10Text');
    const M01Text = document.getElementById('M01Text');
    const M11Text = document.getElementById('M11Text');
    const M20Text = document.getElementById('M20Text');
    const M02Text = document.getElementById('M02Text');
    const width = canvas.width; const height = canvas.height;
    //
    const [M00, M10, M01, M11, M20, M02] = getMomentSet(canvas, reverse);
    // console.debug(M00, M10, M01, M11, M20, M02);
    M00Text.value = M00;
    M10Text.value = M10;
    M01Text.value = M01;
    M11Text.value = M11;
    M20Text.value = M20;
    M02Text.value = M02;
    const [gx, gy] = [M10 / M00, M01 / M00];
    const sqrt_2 = Math.sqrt(2);
    const M20_M01 = M20 - M01;
    const tmp = Math.sqrt(M20_M01 * M20_M01 + 4 * M11 * M11);
    const majorAxis = sqrt_2 * Math.sqrt(M20 + M02 + tmp);
    const minorAxis = sqrt_2 * Math.sqrt(M20 + M02 - tmp);
    const theta = 0.5 * Math.atan2(2 * M11, M20 - M02);
    // console.debug([ gx, gy ]);
    console.debug(majorAxis, minorAxis, theta);
    // Gravity Center
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.strokeStyle = 'rgb(255,0,255)';
    ctx.lineWidth = 2;
    ctx.arc(gx, gy, 10, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Axis
    ctx.lineWidth = 3;
    const size = (width + height) / 2;
    ctx.strokeStyle = 'rgba(255,0,0, 0.5)'; // red
    ctx.beginPath();
    ctx.moveTo(gx - Math.cos(theta) * size, gy - Math.sin(theta) * size);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    //
    ctx.strokeStyle = 'rgba(255,255,0, 0.5)'; // yellow
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(theta) * size, gy + Math.sin(theta) * size);
    ctx.stroke();
    //
    const theta2 = theta + Math.PI / 2;
    ctx.strokeStyle = 'rgba(50,255,0, 0.5)'; // green
    ctx.beginPath();
    ctx.moveTo(gx - Math.cos(theta2) * size, gy - Math.sin(theta2) * size);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    //
    ctx.strokeStyle = 'rgba(100,100,255, 0.5)'; // blue
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(theta2) * size, gy + Math.sin(theta2) * size);
    ctx.stroke();
}
