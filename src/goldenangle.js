'use strict';
/*
 * 2018/12/14- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const hueCanvas = document.getElementById('hueCanvas');
    const colorCanvas = document.getElementById('colorCanvas');
    const maxWidthHeighRange = document.getElementById('maxWidthHeightRange');
    const unitWidthRange  = document.getElementById('unitWidthRange');
    const unitHeightRange = document.getElementById('unitHeightRange');

    const params = {
	maxWidthHeight: parseFloat(maxWidthHeighRange.value),
	unitWidth: parseFloat(unitWidthRange.value),
	unitHeight: parseFloat(unitHeightRange.value)
    };
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'unitWidthRange':'unitWidthText',
		  'unitHeightRange':'unitHeightText'
},
		 function() {
		     const params = {
			 maxWidthHeight: parseFloat(maxWidthHeighRange.value),
			 unitWidth:  parseFloat(unitWidthRange.value),
			 unitHeight: parseFloat(unitHeightRange.value)
		     };
		     drawColor(hueCanvas, colorCanvas, params);
		 });
    drawColor(hueCanvas, colorCanvas, params);
}

function drawColor(hueCanvas, colorCanvas, params) {
    // console.debug("drawCopy");
    const hueCtx = hueCanvas.getContext('2d');
    const colorCtx = colorCanvas.getContext('2d');
    const hueWidth  = hueCanvas.width;
    const hueHeight = hueCanvas.height;
    const colorWidth  = params.maxWidthHeight;
    const colorHeight = params.maxWidthHeight;
    const unitWidth  = params.unitWidth;
    const unitHeight = params.unitHeight;
    hueCanvas.width  = hueWidth; // reset
    colorCanvas.width  = colorWidth;
    colorCanvas.height = colorHeight;
    //
    const colorImageData = new ImageData(colorWidth, colorHeight);
    // https://en.wikipedia.org/wiki/Golden_angle
    const goldenAngle = 180 * (3 - Math.sqrt(5));
    const goldenAngleT = Math.PI * (3 - Math.sqrt(5));
    //
    const hueCenterX = hueWidth  / 2;
    const hueCenterY = hueHeight / 2;
    const hueRadius = Math.min(hueWidth, hueHeight) / 2;
    const unitXMax = Math.ceil(colorWidth / unitWidth);
    const unitYMax = Math.ceil(colorHeight / unitHeight);
    const unitXYMax = unitXMax + unitYMax;
    for (var unitY = 0; unitY < unitYMax; unitY++) {
	for (var unitX = 0; unitX  < unitXMax; unitX++) {
	    const x = unitX * unitWidth;
	    const y = unitY * unitHeight;
	    var unitXY = (unitX + unitY);
	    var h = goldenAngle * unitXY;
	    h = (h % 360) | 0;
	    var color  = 'hsl(' + h + ', 100%, 50%)';
	    const color2 = 'hsla(' + h + ', 100%, 50%, 50%)';
	    var t = (h / 360 * 2 * Math.PI) - (Math.PI / 2);
	    var radiusRatio = (unitXYMax - unitXY) / unitXYMax;
	    // hueCanvas
	    hueCtx.beginPath();
	    hueCtx.fillStyle = color2;
	    hueCtx.moveTo(hueCenterX, hueCenterY);
	    hueCtx.lineTo(hueCenterX + hueRadius * Math.cos(t) * radiusRatio,
			  hueCenterY + hueRadius * Math.sin(t) * radiusRatio);
	    if (x || y) {
		hueCtx.arc(hueCenterX, hueCenterY, hueRadius * radiusRatio, t, t - goldenAngleT, true);
	    } else {
		hueCtx.arc(hueCenterX, hueCenterY, hueRadius * radiusRatio, 0,  2 * Math.PI, false);
	    }
	    hueCtx.lineTo(hueCenterX, hueCenterY);
	    hueCtx.closePath();
	    hueCtx.fill();
	    // colorCanvas
	    colorCtx.beginPath();
	    colorCtx.fillStyle = color;
	    colorCtx.rect(x, y, unitWidth, unitHeight);
	    colorCtx.fill();
	}
    }
    for (var unitY = unitYMax - 1; unitY >= 0; unitY--) {
	for (var unitX = unitXMax - 1; unitX >= 0; unitX--) {
	    var unitXY = (unitX + unitY);
	    var h = goldenAngle * unitXY;
	    var t = (h / 360 * 2 * Math.PI) - (Math.PI / 2);
	    var radiusRatio = (unitXYMax - unitXY) / unitXYMax;
	    var color  = 'hsl(' + h + ', 100%, 50%)';
	    //
	    hueCtx.beginPath();
	    hueCtx.strokeStyle = color;
	    hueCtx.lineWidth = 2;
	    hueCtx.moveTo(hueCenterX, hueCenterY);
	    hueCtx.lineTo(hueCenterX + hueRadius * Math.cos(t) * radiusRatio,
			  hueCenterY + hueRadius * Math.sin(t) * radiusRatio);
	    hueCtx.stroke();
	}
    }
}
