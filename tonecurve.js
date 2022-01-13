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

const MITCHELL_COEFF = cubicBCcoefficient(1/3, 1/3);

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
	drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas, params);
        
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
    case "Cubic":
        makeToneTable_Cubic(params);
        break;
    case "Buggy":
        makeToneTable_Cubic(params);
        break;
    default:
        console.error("unknown interp:"+interp)
    }
}

function neighborMarkers(markers, x, num) {
    const n = markers.length;
    let a = 0, b = 1;
    for (let i = 1 ; i < n ; i++) {
        if (x < markers[i].x) {
            break;
        }
        a += 1;
        b += 1;
    }
    if (a === n) {
        a = n - 2;
        b = n - 1;
    }
    if (b === n) {
        a = n - 2;
        b = n - 1;
    }
    const ma = markers[a];
    const mb = markers[b];
    let ab = ((x - ma.x) < (mb.x - x))? true: false;
    const neighbors = [];
    while (neighbors.length < num) {
        // a: true, b: false
        if (ab) {  // a
            let m;
            if (a >= 0) {
                m = markers[a];
            } else {
                const m0 = markers[0], m1 = markers[1];
                m = Object.assign({}, m0);
                m.x = m0.x - (m1.x - m0.x);
            }
            neighbors.splice(0, 0, m); // append to head
            a -= 1;
        } else {  // b
            let m;
            if (b < n) {
                m = markers[b];  // append to tail
            } else {
                const m0 = markers[n - 2], m1 = markers[n - 1];
                m = Object.assign({}, m1);
                m.x = m1.x + (m1.x - m0.x);
                console.log(m0.x, m1.x, m.x);
            }
            neighbors.push(m);  // append to tail
            b += 1;
        }
        ab = ! ab;
    }
    return neighbors;
}

function makeToneTable_Nearest(params) {
    const markers = params.markers;
    const toneTable = params.toneTable;
    for (let x = 0; x < 256; x++) {
        const [m1] = neighborMarkers(markers, x, 1);
        const y1 = 255 - m1.y;
        // Nearest Neighbor
        toneTable[x] = y1;
    }
}

function makeToneTable_Linear(params) {  // only sample code
    const markers = params.markers;
    const toneTable = params.toneTable;
    for (let x = 0; x < 256; x++) {
        const [m1, m2] = neighborMarkers(markers, x, 2);
        const x1 = m1.x, y1 = 255 - m1.y;
        const x2 = m2.x, y2 = 255 - m2.y;
        // Bi-Linear
        const x1_dist = (x - x1) / (x2 - x1);
        const x2_dist = (x2 - x) / (x2 - x1);
        const y = y1 * (1 - x1_dist) + y2 * (1 - x2_dist);
        toneTable[x] = y;
    }
}

function makeToneTable_Cubic(params) {  // cubic(1/3,1/3): mitchell filter
    const markers = params.markers;
    const toneTable = params.toneTable;
    for (let x = 0; x < 256; x++) {
        const [m1, m2, m3, m4] = neighborMarkers(markers, x, 4);
        console.debug(x, [m1, m2, m3, m4]);
        const x1 = m1.x, y1 = 255 - m1.y;
        const x2 = m2.x, y2 = 255 - m2.y;
        const x3 = m3.x, y3 = 255 - m3.y;
        const x4 = m4.x, y4 = 255 - m4.y;
        // Bi-Cubic: Mitchell
        // x1  x2   x3   x4
        // |    | .  |    |
        //        x
        const scale = 1 / (x2 - x1);
        const x1_dist = (x - x1) * scale;
        const x2_dist = (x - x2) * scale;
        const x3_dist = (x3 - x) * scale;
        const x4_dist = (x4 - x) * scale;
        const c = MITCHELL_COEFF;
        const y = y1 * cubicBC(x1_dist, c) + y2 * cubicBC(x2_dist, c) +
              y3 * cubicBC(x3_dist, c) + y4 * cubicBC(x4_dist, c);
        toneTable[x] = y;
    }
}

function makeToneTable_Buggy(params) {  // Cubic ???
    const markers = params.markers;
    const toneTable = params.toneTable;
    for (let x = 0; x < 256; x++) {
        const [m1, m2, m3, m4] = neighborMarkers(markers, x, 4);
        const x1 = m1.x, y1 = 255 - m1.y;
        const x2 = m2.x, y2 = 255 - m2.y;
        const x3 = m3.x, y3 = 255 - m3.y;
        const x4 = m4.x, y4 = 255 - m4.y;
        const x1_dist = (x - x1);
        const x2_dist = (x - x2);
        const x3_dist = (x3 - x);
        const x4_dist = (x4 - x);
        const c = MITCHELL_COEFF;
        const y = y1 * cubicBC(x1_dist, c) + y2 * cubicBC(x2_dist, c) +
              y3 * cubicBC(x3_dist, c) + y4 * cubicBC(x4_dist, c);
        toneTable[x] = y;
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
