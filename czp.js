"use strict";
/*
 * 2018/10/08- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var canvas = document.getElementById("canvas")
    var widthRange  = document.getElementById("widthRange");
    var heightRange = document.getElementById("heightRange");
    var revRedCheckbox = document.getElementById("revRedCheckbox");
    var revGreenCheckbox = document.getElementById("revGreenCheckbox");
    var revBlueCheckbox = document.getElementById("revBlueCheckbox");
    var params = {
	"width":  parseFloat(widthRange.value),
	"height": parseFloat(heightRange.value),
	"revRed":  revRedCheckbox.checked,
	"revGreen":revGreenCheckbox.checked,
	"revBlue": revBlueCheckbox.checked
    };
    bindFunction({"widthRange":"widthText",
		  "heightRange":"heightText",
		  "revRedCheckbox":null,
		  "revGreenCheckbox":null,
		  "revBlueCheckbox":null},
		 function() {
		     params["width"]  = parseFloat(widthRange.value);
		     params["height"] = parseFloat(heightRange.value);
		     params["revRed"]   = revRedCheckbox.checked;
		     params["revGreen"] = revGreenCheckbox.checked;
		     params["revBlue"]  = revBlueCheckbox.checked;
		     drawCZP(canvas, params);
		 } );
    drawCZP(canvas, params);
}

// http://wazalabo.com/scaling4.html
function drawCZP(canvas, params) {
    // console.debug("drawCZP");
    var ctx = canvas.getContext("2d");
    var width  = params.width;
    var height = params.height;
    var revRed   = params.revRed;
    var revGreen = params.revGreen;
    var revBlue  = params.revBlue;
    canvas.width  = width;
    canvas.height = height;
    //
    var imageData = ctx.createImageData(width, height);
    var cx = Math.PI / width / 2;
    var cy = Math.PI / height / 2;
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var xx = (x - width/2); 
	    var yy = (y - height/2);
	    var v = 128 * Math.sin(cx*xx*xx + cy*yy*yy) + 128;
	    var rgba = [v, v, v, 255];
	    var red   = (revRed)?(255-v):v;
	    var green = (revGreen)?(255-v):v;
	    var blue  = (revBlue)?(255-v):v;
	    setRGBA(imageData, x, y, [red, green, blue, 255]);
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
