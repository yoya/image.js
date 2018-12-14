"use strict";
/*
 * 2018/12/14- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var hueCanvas = document.getElementById("hueCanvas");
    var colorCanvas = document.getElementById("colorCanvas");
    var maxWidthHeighRange = document.getElementById("maxWidthHeightRange");
    var unitWidthRange  = document.getElementById("unitWidthRange");
    var unitHeightRange = document.getElementById("unitHeightRange");

    var params = {
	maxWidthHeight: parseFloat(maxWidthHeighRange.value),
	unitWidth: parseFloat(unitWidthRange.value),
	unitHeight: parseFloat(unitHeightRange.value)
    };
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "unitWidthRange":"unitWidthText",
		  "unitHeightRange":"unitHeightText"},
		 function() {
		     var params = {
			 maxWidthHeight: parseFloat(maxWidthHeighRange.value),
			 unitWidth:  parseFloat(unitWidthRange.value),
			 unitHeight: parseFloat(unitHeightRange.value),
		     };
		     drawColor(hueCanvas, colorCanvas, params);
		 } );
    drawColor(hueCanvas, colorCanvas, params);
}

function drawColor(hueCanvas, colorCanvas, params) {
    // console.debug("drawCopy");
    var hueCtx = hueCanvas.getContext("2d");
    var colorCtx = colorCanvas.getContext("2d");
    var hueWidth  = hueCanvas.width;
    var hueHeight = hueCanvas.height;
    var colorWidth  = params.maxWidthHeight;
    var colorHeight = params.maxWidthHeight;
    var unitWidth  = params.unitWidth;
    var unitHeight = params.unitHeight;
    hueCanvas.width  = hueWidth; // reset
    colorCanvas.width  = colorWidth;
    colorCanvas.height = colorHeight;
    //
    var colorImageData = new ImageData(colorWidth, colorHeight);
    // https://en.wikipedia.org/wiki/Golden_angle
    var goldenAngle = 180 * (3 - Math.sqrt(5));
    var goldenAngleT = Math.PI * (3 - Math.sqrt(5));
    //
    var hueCenterX = hueWidth  / 2;
    var hueCenterY = hueHeight / 2;
    var hueRadius = Math.min(hueWidth, hueHeight) / 2;
    var unitXYMax = Math.ceil(colorWidth/unitWidth) + Math.ceil(colorHeight/unitHeight);
    for (var y = 0 ; y < colorHeight; y += unitHeight) {
        for (var x = 0 ; x < colorWidth; x += unitWidth) {
	    var unitX = (x / unitWidth) | 0;
	    var unitY = (y / unitHeight) | 0;
	    var unitXY = (unitX + unitY);
	    var h = goldenAngle * unitXY;
	    h = (h % 360) | 0;
	    var color = "hsl("+h+", 100%, 50%)";
	    var t = (h / 360 * 2*Math.PI) - (Math.PI/2);
	    var radiusRatio = (unitXYMax - unitXY) / unitXYMax;
	    // hueCanvas
	    hueCtx.beginPath();
	    hueCtx.strokeStyle = color;
	    hueCtx.lineWidth = 1;
	    if (x || y) {
		hueCtx.arc(hueCenterX, hueCenterY, hueRadius * radiusRatio, t - goldenAngleT,  t, false);
	    } else {
		hueCtx.arc(hueCenterX, hueCenterY, hueRadius * radiusRatio, 0,  2*Math.PI, false);
	    }
	    hueCtx.stroke();
	    //
	    hueCtx.beginPath();
	    hueCtx.strokeStyle = color;
	    hueCtx.lineWidth = 2;
	    hueCtx.moveTo(hueCenterX, hueCenterY);
	    hueCtx.lineTo(hueCenterX + hueRadius * Math.cos(t) * radiusRatio,
			  hueCenterY + hueRadius * Math.sin(t) * radiusRatio)
	    hueCtx.stroke();
	    // colorCanvas
	    colorCtx.beginPath();
	    colorCtx.fillStyle = color;
	    colorCtx.rect(x, y, unitWidth, unitHeight);
	    colorCtx.fill();
	}
    }
}
