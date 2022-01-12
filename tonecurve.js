"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

const COLOR_RED   = "#F10";
const COLOR_GREEN = "#0C0";
const COLOR_BLUE  = "#35F";

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const toneCanvas = document.getElementById("toneCanvas");
    const srcImage = new Image();
    const markers = [{x:0, y:255, r:8, lw:2, c:COLOR_RED},
                     {x:255, y:0, r:8, lw:2, c:COLOR_BLUE}];
    const toneTable = new Uint8ClampedArray(256);
    const params = {
        markers: markers,
        toneTable: toneTable,
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
    bindFunction({"interpSelect": null},
		 function() {
                     makeToneTable(params)
                     drawToneCanvas(toneCanvas, params);
		     drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas,
                                              params);
		 }, params);
    bindCursolFunction("toneCanvas", params, function(target, eventType) {
        var {x, y} = params[target.id];
        // console.debug(eventType, x, y);
        switch (eventType) {
        case "mousedown":
            let idx = grabMarker(markers, x, y);
            if (idx === null) {  // add action
                idx = addMarker(params, {x:x, y:y, r:7, lw:2, c:COLOR_GREEN});
            }
            // grab action
            params.grabStatus = true;
            params.grabIndex = idx;
            break;
        case "mouseup":
        case "mouseleave":
            if (params.grabStatus) {  // move action
                const idx = params.grabIndex;
                constraintMarker(markers, idx, x, y);
            }
            params.grabStatus = false;
            // params.grabIndex = null;
        case "mousemove":
            if (params.grabStatus) {  // move action
                const idx = params.grabIndex;
                const m = markers[idx];
                constraintMarker(markers, idx, x, y);
            }
            break;
        case "dblclick":  // delete action
            if (params.grabIndex && (params.grabIndex < (markers.length - 1))) {
                const idx = params.grabIndex;
                delMarker(params, idx)
            }
            params.grabStatus = false;
            params.grabIndex = null;
            break;
        }
        makeToneTable(params)
        drawToneCanvas(toneCanvas, params);
	drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas,
                                 params);
        
    });
    makeToneTable(params)
    drawToneCanvas(toneCanvas, params);
}

function addMarker(params, m) {
    const markers = params.markers;
    let i;
    const n = markers.length;
    for (i = 0 ; i < n ; i++) {
        if (m.x < markers[i].x) {
            break;
        }
    }
    markers.splice(i, 0, m);
    return i;
}

function delMarker(params, i) {
    const markers = params.markers;
    markers.splice(i, 1);
}

function grabMarker(markers, x, y) {
    let i;
    const n = markers.length;
    let mindist = Number.MAX_VALUE;
    let idx = null;
    for (i = 0 ; i < n ; i++) {
        const m = markers[i]
        const dd = (m.x - x)**2 + (m.y - y)**2;
        const rr = (m.r*1.8) ** 2;  // hittest boost rate:1.8
        if ((dd < rr) && (dd < mindist)) {
            mindist = dd;
            idx = i;
        }
    }
    return idx;
}

function constraintMarker(markers, i, x, y) {
    const n = markers.length;
    const m = markers[i];
    if (i === 0) {
        m.x = 0;
    } else if (i === (n - 1)) {
        m.x = 255;
    } else {
        const m1 = markers[i-1];
        const m2 = markers[i+1];
        if (x <= m1.x) {
            m.x = m1.x + 1;
        } else if (m2.x <= x) {
            m.x = m2.x - 1;
        } else {
            m.x = x;
        }
    }
    m.y = y;
}
function drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawToneCurve(srcCanvas, dstCanvas, params);
}

function drawToneCanvas(canvas, params) {
    canvas.style.backgroundColor = "white";
    canvas.width = canvas.width;
    drawMarkers(canvas, params);
    drawToneTable(canvas, params);
}

function drawMarkers(canvas, params) {
    const markers = params.markers;
    const ctx = canvas.getContext("2d");
    //console.log("drawMarkers:", markers);
    for (let i in markers) {
        const {x, y, r, lw, c} = markers[i];
        //console.log(markers);
        //console.log(x, y, r, lw, c);
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

function makeToneTable(params) {
    const markers = params.markers;
    const toneTable = params.toneTable;
    const interp = params.interpSelect;
    switch (interp) {
    case "Nearest":
        makeToneTable_Nearest(params);
        break;
    case "Linear":
        makeToneTable_Linear(params);
        break;
    default:
        console.error("unknown interp:"+interp)
    }
}

function makeToneTable_Nearest(params) {
    const markers = params.markers;
    const toneTable = params.toneTable;
    const n = markers.length;
    for (let i = 1; i < n; i++) {
        const m1 = markers[i-1];
        const m2 = markers[i];
        const x1 = m1.x, y1 = 255 - m1.y;
        const x2 = m2.x, y2 = 255 - m2.y;
        for (let x = x1 ; x <= x2; x++) {
            const ratio = (x - x1) / (x2-x1);
            const y = (ratio < 0.5)? y1: y2;
            toneTable[x] = y;
        }
    }
}
function makeToneTable_Linear(params) {
    const markers = params.markers;
    const toneTable = params.toneTable;
    const n = markers.length;
    for (let i = 1; i < n; i++) {
        const m1 = markers[i-1];
        const m2 = markers[i];
        const x1 = m1.x, y1 = 255 - m1.y;
        const x2 = m2.x, y2 = 255 - m2.y;
        for (let x = x1 ; x <= x2; x++) {
            const y = y1 * (x2-x) / (x2-x1) + y2 * (x-x1) / (x2-x1);
            toneTable[x] = y;
        }
    }
}

function drawToneTable(canvas, params) {
    const markers = params.markers;
    const toneTable =  params.toneTable;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let x = 0; x < 256; x++) {
        const y = 255 - toneTable[x];
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

function drawToneCurve(srcCanvas, dstCanvas, params) {
    // console.debug("drawToneCurve");
    const toneTable =  params.toneTable;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const [r,g,b,a] = getRGBA(srcImageData, x, y);
            const rgba = [toneTable[r],  toneTable[g],  toneTable[b], a];
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
