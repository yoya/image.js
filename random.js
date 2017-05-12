"use strict";
/*
 * 2017/05/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var canvas = document.getElementById("canvas");
    var width = parseInt(document.getElementById("widthRange").value, 10);
    var height = parseInt(document.getElementById("heightRange").value, 10);
    bindFunction({"widthRange":"widthText",
		  "heightRange":"heightText"},
		 function() {
		     width = parseInt(document.getElementById("widthRange").value, 10);
		     height = parseInt(document.getElementById("heightRange").value, 10);
		     drawRandom(canvas, width, height);
		 } );
    drawRandom(canvas, width, height);
}

function drawRandom(canvas, width, height) {
    // console.debug("drawRandom");
    var ctx = canvas.getContext("2d");
    canvas.width  = width;
    canvas.height = height;
    //
    var imageData = ctx.createImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = [Math.random() * 256,
			Math.random() * 256,
			Math.random() * 256,
			255 ];
	    setRGBA(imageData, x, y, rgba);
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
