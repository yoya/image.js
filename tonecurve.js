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
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas,
                                              params);
		 }, {keys: ["maxWidthHeight"]});
    bindParams(params, function(key, target, rel) {
                     makeToneTable(params)
                     drawToneCanvas(toneCanvas, params);
		     drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas,
                                              params);
		 }, {keys: ["interp"]});
    bindCursolFunction("toneCanvas", params, function(target, eventType) {
        var {x, y} = params[target.id];
        // console.debug(eventType, x, y);
        switch (eventType) {
        case "mousedown":
            let idx = grabMarker(markers, x, y, getCanvasDisplayScale(toneCanvas));
            if (idx === null) {  // add action
                idx = addMarker(params, {x:x, y:y, r:7, lw:2, c:COLOR_GREEN});
            }
            if (idx === null) {  // no room to add
                break;
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
    // redraw the markers at a constant size when the display scale changes
    observeCanvasDisplayScale(toneCanvas, function() {
        drawToneCanvas(toneCanvas, params);
    });
}

// insert a marker strictly between the both end markers.
// return null if there is no room (markers must not share the same x).
function addMarker(params, m) {
    const markers = params.markers;
    const n = markers.length;
    let i;
    for (i = 1 ; i < n - 1 ; i++) {
        if (m.x < markers[i].x) {
            break;
        }
    }
    const lo = markers[i - 1].x, hi = markers[i].x;
    if ((hi - lo) < 2) {
        return null;
    }
    m.x = Math.min(Math.max(Math.round(m.x), lo + 1), hi - 1);
    markers.splice(i, 0, m);
    return i;
}

function delMarker(params, i) {
    const markers = params.markers;
    markers.splice(i, 1);
}

// scale: canvas pixels per CSS pixel (keeps the hit area on the screen)
function grabMarker(markers, x, y, scale = 1) {
    let i;
    const n = markers.length;
    let mindist = Number.MAX_VALUE;
    let idx = null;
    for (i = 0 ; i < n ; i++) {
        const m = markers[i]
        const dd = (m.x - x)**2 + (m.y - y)**2;
        const rr = (m.r*1.8*scale) ** 2;  // hittest boost rate:1.8
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
        // integer x keeps markers from sharing the same x.
        m.x = Math.min(Math.max(Math.round(x), m1.x + 1), m2.x - 1);
    }
    m.y = y;
}

function drawSrcImageAndToneCurve(srcImage, srcCanvas, dstCanvas, params) {
    const maxWidthHeight = params.maxWidthHeight;
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
    // r and lw are in CSS px; scaled to keep them constant on the screen
    const scale = getCanvasDisplayScale(canvas);
    //console.log("drawMarkers:", markers);
    for (let i in markers) {
        const {x, y, c} = markers[i];
        const r = markers[i].r * scale, lw = markers[i].lw * scale;
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
    const interp = params.interp;
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
    case "MonotoneCubic":
        makeToneTable_MonotoneCubic(params);
        break;
    case "Buggy":  // not in interpSelect options (experimental)
        makeToneTable_Buggy(params);
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
                m.x = m0.x - (m1.x - m0.x);  // linear extrapolation
                m.y = m0.y - (m1.y - m0.y);
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
                m.x = m1.x + (m1.x - m0.x);  // linear extrapolation
                m.y = m1.y + (m1.y - m0.y);
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
        const scale = 1 / (x2 - x1);
        const x1_dist = (x - x1) * scale;
        const x2_dist = (x2 - x) * scale;
        const y = y1 * (1 - x1_dist) + y2 * (1 - x2_dist);
        toneTable[x] = y;
    }
}

function makeToneTable_Cubic(params) {  // catmull-rom spline
    const markers = params.markers;
    const toneTable = params.toneTable;
    for (let x = 0; x < 256; x++) {
        const [m1, m2, m3, m4] = neighborMarkers(markers, x, 4);
        const x1 = m1.x, y1 = 255 - m1.y;
        const x2 = m2.x, y2 = 255 - m2.y;
        const x3 = m3.x, y3 = 255 - m3.y;
        const x4 = m4.x, y4 = 255 - m4.y;
        // Catmull-Rom (non-uniform): cubic Hermite on [x2, x3]
        // x1  x2   x3   x4
        // |    | .  |    |
        //        x
        // passes through markers even if the intervals are uneven.
        const h = x3 - x2;
        if (h <= 0) {
            toneTable[x] = y2;
            continue;
        }
        const t = (x - x2) / h;
        const d2 = (y3 - y1) / (x3 - x1) * h;  // tangent at x2
        const d3 = (y4 - y2) / (x4 - x2) * h;  // tangent at x3
        const t2 = t * t, t3 = t2 * t;
        const y = ( 2*t3 - 3*t2 + 1) * y2 + (t3 - 2*t2 + t) * d2 +
                  (-2*t3 + 3*t2    ) * y3 + (t3 -   t2    ) * d3;
        toneTable[x] = y;
    }
}

// Monotone cubic Hermite interpolation (Fritsch-Carlson, 1980)
// no overshoot: monotone where the markers are monotone.
function makeToneTable_MonotoneCubic(params) {
    const markers = params.markers;
    const toneTable = params.toneTable;
    const n = markers.length;
    const xs = markers.map(m => m.x);
    const ys = markers.map(m => 255 - m.y);
    // secant slope of each interval
    const delta = new Array(n - 1);
    for (let k = 0; k < n - 1; k++) {
        const h = xs[k+1] - xs[k];
        delta[k] = (h > 0)? (ys[k+1] - ys[k]) / h: 0;
    }
    // initial tangents
    const m = new Array(n);
    m[0] = delta[0];
    m[n-1] = delta[n-2];
    for (let k = 1; k < n - 1; k++) {
        if (delta[k-1] * delta[k] <= 0) {  // local extremum or flat
            m[k] = 0;
        } else {
            m[k] = (delta[k-1] + delta[k]) / 2;
        }
    }
    // limit tangents to keep monotonicity
    for (let k = 0; k < n - 1; k++) {
        if (delta[k] === 0) {
            m[k] = m[k+1] = 0;
            continue;
        }
        const a = m[k] / delta[k], b = m[k+1] / delta[k];
        const s = a * a + b * b;
        if (s > 9) {
            const tau = 3 / Math.sqrt(s);
            m[k]   = tau * a * delta[k];
            m[k+1] = tau * b * delta[k];
        }
    }
    // evaluate cubic Hermite
    let k = 0;
    for (let x = 0; x < 256; x++) {
        while ((k < n - 2) && (xs[k+1] <= x)) {
            k++;
        }
        const h = xs[k+1] - xs[k];
        if (h <= 0) {
            toneTable[x] = ys[k+1];
            continue;
        }
        const t = (x - xs[k]) / h;
        const t2 = t * t, t3 = t2 * t;
        const y = ( 2*t3 - 3*t2 + 1) * ys[k] + (t3 - 2*t2 + t) * m[k] * h +
                  (-2*t3 + 3*t2    ) * ys[k+1] + (t3 - t2) * m[k+1] * h;
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
