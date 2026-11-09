"use strict";
/*
 * 2011/01/22- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const annotate = [];
    const params = {annotate: annotate};
    let mousePointer = null;
    //
    const srcImage = new Image();
    srcImage.onload = function() {
	drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
                     const inputText = document.getElementById("inputText");
                     if (params.type === "B") {
                         inputText.style.display = "block";
                     } else {
                         inputText.style.display = "none";
                     }
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, {keys: ["maxWidthHeight", "type", "font", "input"]});
    bindCursolFunction("dstCanvas", params, function(target, eventType) {
        const p = params[target.id];
        switch (eventType) {
        case "mouseenter":
        case "mousemove":
            mousePointer = p;
            break;
        case "mouseleave":
            mousePointer = null;
            break;
        case "mousedown":
            if (params.type === "AB") {
                annotate.push( { x:p.x, y:p.y, key:params.input } );
                drawText(srcCanvas, dstCanvas, params);
            }
            if (params.type === "C") {
                // let input = document.createElement("input");
            }
            break;

        }
    });
    bindkeyFunction(params,
                    function(event, eventType) {
                        const p = mousePointer;
                        if (p === null) {
                            return ;
                        }
                        // console.log(event, mousePointer);
                        if (params.type === "B") {
                            annotate.push( { x:p.x, y:p.y, key:event.key } );
                            drawText(srcCanvas, dstCanvas, params);
                        }
                    });
}

function drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params) {
    const maxWidthHeight = params.maxWidthHeight;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawText(srcCanvas, dstCanvas, params);
}

function drawText(srcCanvas, dstCanvas, params) {
    // console.debug("drawText");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgba = getRGBA(srcImageData, x, y);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    const annotate = params.annotate;
    for (let i = 0, n = annotate.length; i < n; i++) {
        const a = annotate[i];
        const {x, y, key} = a;
        //dstCtx.font = "18px serif";
        dstCtx.font = "18px Nico Moji, cursive";
        dstCtx.strokeText(key, x, y);
    }
}
