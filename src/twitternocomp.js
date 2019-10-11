'use strict';
/*
 * 2019/02/01- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndTransSet(srcImage, srcCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function() {
		     drawSrcImageAndTransSet(srcImage, srcCanvas);
		 });
}
function drawSrcImageAndTransSet(srcImage, srcCanvas) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawTransSet(srcCanvas);
}

function drawTransSet(canvas) {
    // console.debug("drawCopy");
    const ctx = canvas.getContext('2d');
    const width = canvas.width; const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    let  transparentFound = false;
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
	    var [r, g, b, a] = getRGBA(imageData, x, y);
            if (a < 255) {
                transparentFound = true;
                break;
            }
	}
    }
    if (transparentFound === false) {
        var [x, y] = [width - 1, height - 1]; // right-bottom corner
        var [r, g, b, a] = getRGBA(imageData, x, y);
        setRGBA(imageData, x, y, [r, g, b, a - 1]);
        ctx.putImageData(imageData, 0, 0);
    }
}
