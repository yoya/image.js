"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const toneCanvas = document.getElementById("toneCanvas");
    const srcImage = new Image();
    const markers = [{x:0, y:255, r:7, lw:2, c:"red"},
                     {x:255, y:0, r:7, lw:2, c:"blue"}]
    const params = {
        markers: markers,
        grabStatus: false,
        grabIndex: null,
    };
    srcImage.onload = function() {
	drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
    bindCursolFunction("toneCanvas", params, function(target, eventType) {
        var {x, y} = params[target.id];
        // console.debug(eventType, x, y);
        switch (eventType) {
        case "mousedown":
            
            break;
        case "mouseup":
            addMarker(params, {x:x, y:y, r:7, lw:2, c:"green"});
            console.log(params.markers);;
        case "mousemove":
            break;
        }
        drawToneCanvas(toneCanvas, params);
    });
}

function addMarker(params, m) {
    const markers = params.markers;
    let i;
    const n = markers.length;
    for (i = 0 ; i < n ; i++) {
        if (markers[i].x < m.x) {
            break;
        }
    }
    markers.splice(i, 0, m);
}

function grabMarker(markers, m) {
    let i;
    const n = markers.length;
    let distance = Number.MAX_VALUE;
    for (i = 0 ; i < n ; i++) {
        if (markers[i].x < m.x) {
            break;
        }
    }
}

function drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawToneCurve(srcCanvas, dstCanvas);
}

function drawToneCanvas(canvas, params) {
    canvas.width = canvas.width;
    drawMarkers(canvas, params);
}

function drawMarkers(canvas, params) {
    const markers = params.markers;
    const ctx = canvas.getContext("2d");
    console.log("drawMarkers:", markers);
    for (let i in markers) {
        const {x, y, r, lw, c} = markers[i];
        console.log(markers);
        console.log(x, y, r, lw, c);
        // cross
        ctx.fillStyle = c;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.rect(x-(lw/2), y-r, lw, r*2);
        ctx.rect(x-r, y-(lw/2), r*2, lw);
        ctx.fill();
        // circle
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.5
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.stroke();
    }
}


function drawToneCurve(srcCanvas, dstCanvas) {
    // console.debug("drawToneCurve");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgba = getRGBA(srcImageData, x, y);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
