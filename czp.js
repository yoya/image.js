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
    var params = {
	"width":  parseFloat(widthRange.value),
	"height": parseFloat(heightRange.value)
    };
    bindFunction({"widthRange":"widthText",
		  "heightRange":"heightText"},
		 function() {
		     params["width"]  = parseFloat(widthRange.value);
		     params["height"] = parseFloat(heightRange.value);
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
	    setRGBA(imageData, x, y, rgba);
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
