"use strict";
/*
 * 2020/08/03- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var tmpCanvas = document.getElementById("tmpCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndCopy(srcImage, srcCanvas, tmpCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, tmpCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndCopy(srcImage, srcCanvas, tmpCanvas, dstCanvas) {
    let maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSpectrumCube(srcCanvas, tmpCanvas, dstCanvas);
}

/*
  0 1 2
  3 4 5
  6 7 8
*/
function detectArea(x, y, width, height) {
    let xx = 0;
    if ((width*0.2) < x) {
        xx = 1;
        if ((width*0.8) < x) {
            xx = 2;
        }
    }
    let yy = 0;
    if ((height*0.2) < y) {
        yy = 1;
        if ((height*0.8) < y) {
            yy = 2;
        }
    }
    return xx + 3 * yy;
}


function drawSpectrumCube(srcCanvas, tmpCanvas, dstCanvas) {
    // console.debug("drawCopy");
    let srcCtx = srcCanvas.getContext("2d");
    let tmpCtx = tmpCanvas.getContext("2d");
    let dstCtx = dstCanvas.getContext("2d");
    let width = srcCanvas.width, height = srcCanvas.height;
    tmpCanvas.width  = width;
    tmpCanvas.height = height;
    //
    let srcImageData = srcCtx.getImageData(0, 0, width, height);
    let tmpImageData = tmpCtx.createImageData(width, height);
    
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            let area = detectArea(x, y, width, height);
	    let  [r, g, b, a] = getRGBA(srcImageData, x, y);
            let filter = null;
            let [cx, cy] = [0, 0];
            switch (area) {
            case 1:  // up: green
                filter = [0.5, 1.0, 0.2];
                [cx, cy] = [width / 2, height * -0.1];
                break;
            case 3:  // left: yellow
                filter = [0.8, 0.8, 0.2];
                [cx, cy] = [width / 2, height * -0.1];
                break;
            case 4:  // center: red
                filter = [1.0, 0.3, 0.3];
                [cx, cy] = [width / 2, height / 2];
                break;
            case 5:  // right: cyan
                filter = [0.3, 0.8, 0.8];
                [cx, cy] = [width * 1.1, height / 2];
                break;
            case 7:  // buttom: blue
                filter = [0.2, 0.5, 1.0];
                [cx, cy] = [width / 2, height * 1.1];
                break;
            }
            if (filter === null) {
                let gray = (0.3*r + 0.6*g + 0.1*b) / 2;
                r = g = b = gray;
            } else {
                let gray = (0.3*r + 0.6*g + 0.1*b) / 2;
                let [fr, fg, fb] = filter;
                r = r - 255*(1-fr);
                g = g - 255*(1-fg);
                b = b - 255*(1-fb);
                let rad = Math.sqrt((x-cx)**2 + (y-cy)**2) / (width/4);
                let ratio = Math.cos(rad);
                r = r * ratio + gray * (1-ratio);
                g = g * ratio + gray * (1-ratio);
                b = b * ratio + gray * (1-ratio);
            }
	    setRGBA(tmpImageData, x, y, [r,g,b,a]);
	}
    }
    tmpCtx.putImageData(tmpImageData, 0, 0);
}
