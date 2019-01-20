"use strict";
/*
 * 2018/01/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var canvas = document.getElementById("canvas");
    var widthRange = document.getElementById("widthRange");
    var heightRange = document.getElementById("heightRange");
    var width = parseFloat(widthRange.value);
    var height = parseFloat(heightRange.value);
    bindFunction({"widthRange":"widthText",
                  "heightRange":"heightText"},
		 function(target, rel) {
                     width  = parseFloat(widthRange.value);
                     height = parseFloat(heightRange.value);
                     drawTestcard(canvas, width, height);
		 } );
    drawTestcard(canvas, width, height);
}

function drawTestcard(canvas, width, height) {
    var testcardImage = getTestcardImage(width, height);
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.putImageData(testcardImage, 0, 0);
}
