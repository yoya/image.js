"use strict";
/*
 * 2020/09/10- (c) yoya@awm.jp
 * ref) https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

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
    var params = {
        coeff: [1, 0, 0,
                0, 1, 0,
                0, 0, 1],
        grabbedMarker: null,
    };
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            drawHomograpy(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "markerCheckbox":null,
                  "interpolationSelect":null,
                  "aRange":"aText", "bRange":"bText", "cRange":"cText",
                  "dRange":"dText", "eRange":"eText", "fRange":"fText",
                  "gRange":"gText", "hRange":"hText"},
		 function(target, rel) {
                     // params["maxWidthHeight"] = parseFloat(maxWidthHeightRange.value);
                     let num = coeffNameIndex(target.id);
                     if (num >= 0) {
                         params.coeff[num] = parseFloat(target.value);
                     }
                     drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
    bindCursolFunction("srcCanvas", params, function(target, eventType) {
        if ((!params.markerCheckbox) || (!params.markerArray)) {
            return ;  // skip
        }
        var [x, y] = params[target.id]
        // console.debug(eventType, x, y, params.markerArray);
        //
        let hittestRadius2 = 10 ** 2;
        let markerArray = params.markerArray;
        switch (eventType) {
        case "mousedown":
            let grabbedDist2 = 0;
            let grabbedMarker = null;
            for (let i = 0, n = markerArray.length; i < n; i++) {
                let [xx, yy] = markerArray[i];
                let dist2 = (x-xx)**2 + (y-yy)**2;
                if (dist2 < hittestRadius2) {
                    if (grabbedMarker === null) {
                        grabbedMarker = i;
                        grabbedDist2 = dist2;
                    } else {
                        if (grabbedDist < dist2) {
                            grabbedMarker = i;
                            grabbedDist2 = dist2;
                        }
                    }
                }
            }
            params.grabbedMarker = grabbedMarker;
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
            markerArray[params.grabbedMarker] = [x, y];
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
}

var worker = new workerProcess("worker/homography.js");

function drawHomograpy(srcImage, srcCanvas, dstCanvas, params, sync) {
    drawSrcImage(srcImage, srcCanvas, params["maxWidthHeightRange"]);
    //
    params.marker = params.markerCheckbox;
    if (params.interpolationSelect === "NNBL") {
        params.interpolation = sync? "BL": "NN";
    } else {
        params.interpolation = params.interpolationSelect;
    }
    worker.process(srcCanvas, dstCanvas, params, sync);
    worker.addListener(function() {
        if (params.marker) {
            drawMarker(srcCanvas, params.coeff, params);
        }
    });
}

function drawMarker(canvas, coeff, params) {
    let ctx = canvas.getContext("2d");
    let width = canvas.width, height = canvas.height;
    let xyArr = [
        homography(0.0, 0.0, coeff), homography(1.0, 0.0, coeff),
        homography(1.0, 1.0, coeff), homography(0.0, 1.0, coeff),
    ];
    for (let i = 0, n = xyArr.length; i < n; i++) {
        let [x, y] = xyArr[i];
        xyArr[i] = [x * width, y * height];
    }
    params.markerArray = xyArr;
    ctx.lineWidth = 2;
    let colors = ["red", "yellow", "green", "blue"];
    for (let i = 0, n = xyArr.length; i < n; i++) {
        let [x, y] = xyArr[i];
        //
        ctx.beginPath();
        ctx.strokeStyle = colors[i];
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.arc(x, y, 8, 0, 2*Math.PI, false);
        ctx.fill();
        ctx.stroke();
        //
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(x, y, 2, 0, 2*Math.PI, false);
        ctx.fill();
        //
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = colors[i];
        var xyArrNext = xyArr[(i+1)%4];
        ctx.lineTo(xyArrNext[0], xyArrNext[1]);
        ctx.stroke();
    }
}

