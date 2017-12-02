"use strict";
/*
 * 2017/12/02- (c) yoya@awm.jp. All Rights Reserved.
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var dstCanvas = document.getElementById("dstCanvas");
    bindFunction({"widthRange":"widthText",
		  "heightRange":"heightText"},
		 function() {
		     drawGeoffrey(dstCanvas);
		 } );
    drawGeoffrey(dstCanvas);
}

/*
  https://en.wikibooks.org/wiki/GLSL_Programming/Vector_and_Matrix_Operations
*/
function vector3_values(a) {
    return [a, a, a];
}
function vector3_minus(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function vector3_multiply(a, b) {
    var [a0, a1, a2] = a;
    var [b0, b1, b2] = b;
    return [a0 * b0, a1 * b1, a2 * b2];
    /*
    return [a1 * b2 - a2 * b1,
	    a2 * b0 - a0 * b2,
	    a0 * b1 - a1 * b0];
    */
}

/*
 https://twitter.com/Donzanoid/status/903424376707657730
 vec3 Geoffrey(float t)
 {
   vec3 r = t * 2.1 - vec3(1.8, 1.14, 0.3);
   return 1.0 - r * r;
 }
*/

function Geoffrey(t) {
    var r = vector3_minus(vector3_values(t * 2.1), [1.8, 1.14, 0.3]);
    return vector3_minus(vector3_values(1.0) , vector3_multiply(r,  r));
}
function drawGeoffrey(canvas) {
    var width = parseFloat(document.getElementById("widthRange").value);
    var height = parseFloat(document.getElementById("heightRange").value);
    canvas.width = width;
    canvas.height = height;
    var ctx = dstCanvas.getContext("2d");
    //
    var imageData = new ImageData(width, height);
    for (var x = 0 ; x < width; x++) {
	var l = x/width;
	var [r, g, b] = Geoffrey(l);
	for (var y = 0 ; y < height; y++) {
	    setRGBA(imageData, x, y, [r*255,g*255,b*255, 255]);
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
