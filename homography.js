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
        document.getElementById(cName+"Range").value = coeff[i];
        document.getElementById(cName+"Text").value = coeff[i];
    }
}

function main() {
    // console.debug("main");
    let srcCanvas = document.getElementById("srcCanvas");
    let dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let maxWidthHeightRange = document.getElementById("maxWidthHeightRange");
    let markerCheckbox = document.getElementById("markerCheckbox");
    var params = {
        maxWidthHeight: parseFloat(maxWidthHeightRange.value),
        coeff: [1, 0, 0,
                0, 1, 0,
                0, 0, 1],
        marker: markerCheckbox.checked,
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
                  "aRange":"aText", "bRange":"bText", "cRange":"cText",
                  "dRange":"dText", "eRange":"eText", "fRange":"fText",
                  "gRange":"gText", "hRange":"hText"},
		 function(target, rel) {
                     params["maxWidthHeight"] = parseFloat(maxWidthHeightRange.value);
                     params["marker"] = markerCheckbox.checked;

                     let num = coeffNameIndex(target.id);
                     if (num >= 0) {
                         params.coeff[num] = parseFloat(target.value);
                     }
                     drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
		 } );
    bindCursolFunction("srcCanvas", params, function(target, eventType) {
        if ((!params.marker) || (!params.markerArray)) {
            return ;  // skip
        }
        var [x, y] = params[target.id]
        // console.debug(eventType, x, y, params.markerArray);
        //
        let hittestRadius2 = 7 ** 2;
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
            params.coeff = markers2coeff(markersNorm);
            coeffValueSet(params.coeff);
            drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
            if (eventType === "mouseup") {
                params.grabbedMarker = null;
            }
            break;
        }
    });
}

/*
  https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu?slide=16
  marker index:0,1,2,3 => 00, 10, 11, 01
*/
function markers2coeff(markerArray) {
    // console.debug("markers2coeff:", markerArray);
    var [[x00,y00], [x10,y10], [x11,y11], [x01,y01]] = markerArray;
    let c = x00;
    let f = y00;
    //
    let dx0100 = x01 - x00, dx1000 = x10 - x00;  // dx = xij - x00
    let dy0100 = y01 - y00, dy1000 = y10 - y00;  // dy = yij - y00
    let dx1101 = x11 - x01, dx1110 = x11 - x10;  // Dx = x11 - xij
    let dy1101 = y11 - y01, dy1110 = y11 - y10;  // Dy = y11 - yij
    let xi = dx1101 * dy1110 - dx1110 * dy1101; // Ξ
    let g = ( dy1000 * dx1101 - dx1000 * dy1101) / xi;
    let h = (-dy0100 * dx1110 + dx0100 * dy1110) / xi;
    //
    let a = (dx1000*(x11*y01 - x01*y11) + dx1101*(x00*y10 - x10*y00)) / xi;
    let d = (dy1101*(x00*y10 - y00*x10) + dy1000*(y01*x11 - y11*x01)) / xi;
    let b = (dx1110*(y00*x01 - x00*y01) + dx0100*(y11*x10 - x11*y10)) / xi;
    let e = (dy0100*(y11*x10 - y10*x11) + dy1110*(y00*x01 - y01*x00)) / xi;
    return [a, b, c, d, e, f, g, h];
}

var worker = new workerProcess("worker/homography.js");

function drawHomograpy(srcImage, srcCanvas, dstCanvas, params, sync) {
    drawSrcImage(srcImage, srcCanvas, params["maxWidthHeight"]);
    //
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
    ctx.beginPath();
    ctx.moveTo(xyArr[3][0],xyArr[3][1]);
    let colors = [["red"], "yellow", "green", "blue"];
    for (let i = 0, n = xyArr.length; i < n; i++) {
        let [x, y] = xyArr[i];
        ctx.strokeStyle = colors[(i+3)%4];
        ctx.lineTo(x, y)
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = colors[i];
        ctx.fillStyle = "white";
        ctx.arc(x, y, 9, 0, 2*Math.PI, false);
        ctx.stroke();
        ctx.fill();
        ctx.moveTo(x, y);
    }
}

