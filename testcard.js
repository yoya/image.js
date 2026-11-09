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
    var params = {};
    bindParams(params, function(key, target, rel) {
                     drawTestcard(canvas, params.width, params.height);
		 }, {keys: ["width", "height"]});
    drawTestcard(canvas, params.width, params.height);
}

function drawTestcard(canvas, width, height) {
    var testcardImage = getTestcardImage(width, height);
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.putImageData(testcardImage, 0, 0);
}
