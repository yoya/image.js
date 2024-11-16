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
            bind2elements(params);
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
                         markerArray[0][0] = params.markerX0;
                         markerArray[0][1] = params.markerY0;
                         markerArray[1][0] = params.markerX1;
                         markerArray[1][1] = params.markerY1;
                         markerArray[2][0] = params.markerX2;
                         markerArray[2][1] = params.markerY2;
                         markerArray[3][0] = params.markerX3;
                         markerArray[3][1] = params.markerY3;
                         const { width, height } = srcCanvas;
                         const markersNorm = [ [ markerArray[0][0] / width,
                                                 markerArray[0][1] / height ],
                                               [ markerArray[1][0] / width,
                                                 markerArray[1][1] / height ],
                                               [ markerArray[2][0] / width,
                                                 markerArray[2][1] / height ],
                                               [ markerArray[3][0] / width,
                                                 markerArray[3][1] / height ]
                                           ];
                         params.coeff = homographyCoeffByMarkers(markersNorm);

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
            params[markerNameList[params.grabbedMarker*2]] = x;
            params[markerNameList[params.grabbedMarker*2+1]] = y;
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
    worker.addListener(function() {
        if (params.srcMarkers) {
            // console.log("coeff:", params.coeff);
            // console.log("coeff invert:", invertMatrix(params.coeff, 3));
            //
            let width = dstCanvas.width, height = dstCanvas.height;
            let xyArr = drawMarker(srcCanvas, params.coeff);
            params.markerArray = xyArr;
            if (params.dstMarkers) {
                let xyNorm = [
                    [xyArr[0][0] / width, xyArr[0][1] / height],
                    [xyArr[1][0] / width, xyArr[1][1] / height],
                    [xyArr[2][0] / width, xyArr[2][1] / height],
                    [xyArr[3][0] / width, xyArr[3][1] / height]
                ];
                // let forwardCoeff =  homographyCoeffByMarkers(xyNorm, true);
                let forwardCoeff = invertMatrix(params.coeff, 3);
                //console.log("forwardCoeff:", forwardCoeff);
                params.forwardCoeff = forwardCoeff;
                let dstMarkerArray = drawMarker(dstCanvas, forwardCoeff, xyNorm[0]);
                params.dstMarkerArray = dstMarkerArray;
            }
        }
    });
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
    ctx.lineWidth = 2;
    let colors = ["red", "yellow", "blue", "green"];
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
    return markerArray
}

