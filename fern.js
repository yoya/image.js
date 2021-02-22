"use strict";
/*
 * 2021/02/22- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var canvas = document.getElementById("canvas");
    bindFunction({"widthRange":"widthText",
                  "heightRange":"heightText",
                  "countRange":"countText"},
		 function() {
		     drawFern(canvas);
		 } );
    drawFern(canvas);
}

function fern(x, y) {    
    let r = Math.random();
    let xy;
    if (r < 0.01) {
        xy = [ 0,
               0.16 * y]
    } else if (r < 0.08) {
        xy = [ 0.2 * x - 0.26 * y,
               0.23 * x + 0.22 * y + 1.6 ];
    } else if (r < 0.15) {
        xy = [ -0.15 * x + 0.28 * y,
               0.26 * x + 0.24 * y + 0.44 ];
    } else {
        xy = [ 0.85 * x + 0.04 * y,
               -0.04 * x + 0.85 * y + 1.6 ];
    }
    return xy;
}

function drawFern(canvas) {
    var ctx = canvas.getContext("2d");
    const widthRange  = document.getElementById("widthRange");
    const heightRange = document.getElementById("heightRange");
    const countRange = document.getElementById("countRange");
    const width  = parseFloat(widthRange.value);
    const height = parseFloat(heightRange.value);
    const count =  parseFloat(countRange.value);
    canvas.width = width;
    canvas.height = height;
    var imageData = ctx.createImageData(width, height);
    var x = 0, y = 0;
    for (let i = 0; i < count; i++) {
        const xx = (x + 2.5) * width  / 5.3;
        const yy = (10.5 - y) * height / 11;
        const offset = ((xx|0) + (yy|0) * width) * 4;
        imageData.data[offset+ 1] += 0xc0;  // green
        imageData.data[offset+ 3] = 255;    // alpha
        [x, y] = fern(x, y);
    }
    ctx.putImageData(imageData, 0, 0);
}
