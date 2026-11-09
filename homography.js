"use strict";
/*
 * 2020/09/10- (c) yoya@awm.jp
 * ref) https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

const markerNameList = [ "markerX0", "markerY0",
                         "markerX1", "markerY1",
                         "markerX2", "markerY2",
                         "markerX3", "markerY3" ];
var coeffNameList = ["a", "b", "c", "d", "e", "f", "g", "h"];

function coeffNameIndex(name) {
    for (let i = 0, n = coeffNameList.length; i < n ; i++) {
        let cName = coeffNameList[i];
        if ((name === cName+"Range") || (name === cName+"Text")) {
            return i;
       }
    }
    return -1;
}

function coeffValueSet(coeff) {
    for (let i = 0, n = coeffNameList.length; i < n ; i++) {
        let cName = coeffNameList[i];
        var range = document.getElementById(cName+"Range");
        range.value = coeff[i];
        document.getElementById(cName+"Text").value = range.value;
    }
}

function main() {
    // console.debug("main");
    let srcCanvas = document.getElementById("srcCanvas");
    let dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const markerArray =  [[0,0], [0,100], [100,0], [100,100]];
    var params = {
        coeff: [1, 0, 0,
                0, 1, 0,
                0, 0, 1],
        forwardCoeff: [1, 0, 0,
                       0, 1, 0,
                       0, 0, 1],
        grabbedMarker: null,
        markerArray: markerArray,
    };
    // register once. (drawHomograpy is called on every redraw)
    worker.addListener(function() {
        if (params.dstMarkers) {
            drawDstMarkers(dstCanvas, params);
        }
    });
    const imageOnLoad = (url) => {
	srcImage = new Image();
	srcImage.onload = function() {
            params.markerX0 = 0;
            params.markerY0 = 0;
            params.markerX1 = srcImage.width;
            params.markerY1 = 0;
            params.markerX2 = 0;
            params.markerY2 = srcImage.height;
            params.markerX3 = srcImage.width;
            params.markerY3 = srcImage.height;
            // reset the transform to match the markers at the image corners.
            params.coeff = [1, 0, 0,
                            0, 1, 0,
                            0, 0, 1];
            bind2elements(params);
            coeffValueSet(params.coeff);  // after bind2elements (it overwrites)
            drawHomograpy(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = url;
    }
    dropFunction(document, imageOnLoad, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "srcMarkers":null, "dstMarkers":null,
                  "interpolationSelect":null,
                  "markerX0":null, "markerY0":null,
                  "markerX1":null, "markerY1":null,
                  "markerX2":null, "markerY2":null,
                  "markerX3":null, "markerY3":null,
                  "aRange":"aText", "bRange":"bText", "cRange":"cText",
                  "dRange":"dText", "eRange":"eText", "fRange":"fText",
                  "gRange":"gText", "hRange":"hText"},
		 function(target, rel) {
                     // params["maxWidthHeight"] = parseFloat(maxWidthHeightRange.value);
                     let num = coeffNameIndex(target.id);
                     if (markerNameList.includes(target.id)) {
                         // marker fields are in the source image pixels
                         // (independent of maxWidthHeight scaling).
                         const { width, height } = srcImage;
                         const markersNorm = [0, 1, 2, 3].map(i => [
                             parseFloat(params[markerNameList[i*2]]) / width,
                             parseFloat(params[markerNameList[i*2+1]]) / height
                         ]);
                         params.coeff = homographyCoeffByMarkers(markersNorm);
                         coeffValueSet(params.coeff);
                     }
                     if (num >= 0) {
                         params.coeff[num] = parseFloat(target.value);
                     }
                     drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
    bindCursolFunction("srcCanvas", params, function(target, eventType) {
        if ((!params.srcMarkers) || (!params.markerArray)) {
            return ;  // skip
        }
        var {x, y} = params[target.id];
        // console.debug(eventType, x, y, params.markerArray);
        //
        let hittestRadius2 = 16 ** 2;
        let markerArray = params.markerArray;
        switch (eventType) {
        case "mousedown":
            params.grabbedMarker = grabMarkerIndex(markerArray, x, y,
                                                   hittestRadius2);
            // console.debug(eventType, params.grabbedMarker, x, y);
            break;
        case "mousemove":
        case "mouseup":
            let width = srcCanvas.width, height = srcCanvas.height;
            if (params.grabbedMarker === null) {
                break;
            }
            let rel = (eventType === "mouseup");
            // console.debug(eventType, x, y, rel);
            markerArray[params.grabbedMarker] = [x, y];  // canvas pixels
            // marker fields are in the source image pixels
            params[markerNameList[params.grabbedMarker*2]] =
                x * srcImage.width / width;
            params[markerNameList[params.grabbedMarker*2+1]] =
                y * srcImage.height / height;
            bind2elements(params);
            var markersNorm = [
                [markerArray[0][0] / width, markerArray[0][1] / height],
                [markerArray[1][0] / width, markerArray[1][1] / height],
                [markerArray[2][0] / width, markerArray[2][1] / height],
                [markerArray[3][0] / width, markerArray[3][1] / height]
            ];
            params.coeff = homographyCoeffByMarkers(markersNorm);
            coeffValueSet(params.coeff);
            drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
            if (eventType === "mouseup") {
                params.grabbedMarker = null;
            }
            break;
        }
    });
    // dst markers: the src image corners mapped on dst.
    bindCursolFunction("dstCanvas", params, function(target, eventType) {
        if ((!params.dstMarkers) || (!params.dstMarkerArray)) {
            return ;  // skip
        }
        const {x, y} = params[target.id];
        const hittestRadius2 = 16 ** 2;
        const dstMarkerArray = params.dstMarkerArray;
        switch (eventType) {
        case "mousedown":
            params.dstGrabbedMarker = grabMarkerIndex(dstMarkerArray, x, y,
                                                      hittestRadius2);
            break;
        case "mousemove":
        case "mouseup":
            if ((params.dstGrabbedMarker === null) ||
                (params.dstGrabbedMarker === undefined)) {
                break;
            }
            const rel = (eventType === "mouseup");
            dstMarkerArray[params.dstGrabbedMarker] = [x, y];
            const { width, height } = dstCanvas;
            const dstMarkersNorm = dstMarkerArray.map(([xx, yy]) =>
                                                      [xx / width, yy / height]);
            // dst markers => unit square (src) : that is dst => src coeff.
            let coeff = homographyCoeffByMarkers(dstMarkersNorm, true);
            coeff = coeff.map(v => v / coeff[8]);  // normalize i to 1
            params.coeff = coeff;
            // src markers follow: dst corners mapped on src (image pixels).
            const corners = [[0, 0], [1, 0], [0, 1], [1, 1]];
            for (let i = 0; i < 4; i++) {
                const [sx, sy] = homography(corners[i][0], corners[i][1], coeff);
                params[markerNameList[i*2]]   = sx * srcImage.width;
                params[markerNameList[i*2+1]] = sy * srcImage.height;
            }
            bind2elements(params);
            coeffValueSet(params.coeff);  // after bind2elements (it overwrites)
            drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
            if (eventType === "mouseup") {
                params.dstGrabbedMarker = null;
            }
            break;
        }
    });
}

// index of the nearest marker within the radius, or null.
function grabMarkerIndex(markerArray, x, y, radius2) {
    let grabbedMarker = null;
    let grabbedDist2 = radius2;
    for (let i = 0, n = markerArray.length; i < n; i++) {
        const [xx, yy] = markerArray[i];
        const dist2 = (x-xx)**2 + (y-yy)**2;
        if (dist2 < grabbedDist2) {
            grabbedMarker = i;
            grabbedDist2 = dist2;
        }
    }
    return grabbedMarker;
}

var worker = new workerProcess("worker/homography.js");

function drawHomograpy(srcImage, srcCanvas, dstCanvas, params, sync) {
    drawSrcImage(srcImage, srcCanvas, params["maxWidthHeightRange"]);
    //
    if (params.interpolationSelect === "NNBL") {
        params.interpolation = sync? "BL": "NN";
    } else {
        params.interpolation = params.interpolationSelect;
    }
    worker.process(srcCanvas, dstCanvas, params, sync);
    if (params.srcMarkers) {
        const { width , height } = srcCanvas;
        let xyArr = drawMarker(srcCanvas, params.coeff);
        params.markerArray = xyArr;
    }
}

/*
  draw the src image corners on dst, mapped by the forward transform.
  (coeff maps dst => src, so forward is its inverse.
   homographyCoeffByMarkers(srcMarkersNorm, true) gives the same up to scale)
*/
function drawDstMarkers(dstCanvas, params) {
    const forwardCoeff = invertMatrix(params.coeff, 3);
    params.forwardCoeff = forwardCoeff;
    params.dstMarkerArray = drawMarker(dstCanvas, forwardCoeff);
}

/*
  xy00 if toSquare transform
*/
function drawMarker(canvas, coeff, xy00) {
    let ctx = canvas.getContext("2d");
    let width = canvas.width, height = canvas.height;
    let xyArr = [
        homography(0.0, 0.0, coeff, xy00), homography(1.0, 0.0, coeff, xy00),
        homography(0.0, 1.0, coeff, xy00), homography(1.0, 1.0, coeff, xy00),
    ];
    for (let i = 0, n = xyArr.length; i < n; i++) {
        let [x, y] = xyArr[i];
        xyArr[i] = [x * width, y * height];
    }
    let markerArray = xyArr;
    // bright colors (red, yellow, blue, green) for dark images too.
    let colors = ["rgb(255,80,80)", "rgb(255,255,0)",
                  "rgb(80,160,255)", "rgb(80,220,80)"];
    // dark outline under the colored stroke, visible on any background.
    const outlineColor = "rgba(0,0,0,0.6)";
    const outlineWidth = 4, strokeWidth = 2;
    // lines (all outlines first, then colors, so outlines don't cover colors)
    for (const [lineWidth, isOutline] of [[outlineWidth, true],
                                          [strokeWidth, false]]) {
        ctx.lineWidth = lineWidth;
        for (let i = 0, n = xyArr.length; i < n; i++) {
            let [x, y] = xyArr[i];
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = isOutline? outlineColor: colors[i];
            /*
             *  0 ---->1
             *  ^      |
             *  |      V
             *  2 <--- 3
             * i: 0=>1,1=>3,2=>0,3=>2
             * floor((i+3)/2): 0=>1,1=>2,2=>2, 3=>3
             * floor((3*i+3)/2)%4: 0=>1,1=>3,2=>0, 3=>2
             */
            var xyArrNext = xyArr[Math.floor((3*i+3)/2)%4];
            ctx.lineTo(xyArrNext[0], xyArrNext[1]);
            ctx.stroke();
        }
    }
    // rings on top of the lines
    for (let i = 0, n = xyArr.length; i < n; i++) {
        let [x, y] = xyArr[i];
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.arc(x, y, 8, 0, 2*Math.PI, false);
        ctx.fill();
        ctx.lineWidth = outlineWidth;
        ctx.strokeStyle = outlineColor;
        ctx.stroke();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = colors[i];
        ctx.stroke();
        //
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(x, y, 2, 0, 2*Math.PI, false);
        ctx.fill();
    }
    return markerArray
}

