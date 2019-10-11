'use strict';
/*
 * 2018/01/21- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const canvas = document.getElementById('canvas');
    const widthRange = document.getElementById('widthRange');
    const heightRange = document.getElementById('heightRange');
    let width = parseFloat(widthRange.value);
    let height = parseFloat(heightRange.value);
    bindFunction({
'widthRange':'widthText',
                  'heightRange':'heightText'
},
		 function(target, rel) {
                     width  = parseFloat(widthRange.value);
                     height = parseFloat(heightRange.value);
                     drawTestcard(canvas, width, height);
		 });
    drawTestcard(canvas, width, height);
}

function drawTestcard(canvas, width, height) {
    const testcardImage = getTestcardImage(width, height);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(testcardImage, 0, 0);
}
