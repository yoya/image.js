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
    var x = 0, y = 0;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#0c0";
    for (let i = 0; i < count; i++) {
        ctx.beginPath();
        const xx = (x + 2.4) * width  / 5.3;
        const yy = (y + 0.5) * height / 11;
        ctx.arc(xx, yy, 1, 0, 2*Math.PI);
        ctx.fill();
        [x, y] = fern(x, y);
    }
}
