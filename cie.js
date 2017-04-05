"use strict";
/*
 * 2017/04/05- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    console.debug("cie main()");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var file = "data/ciexyz64.json";
    var cieArr = null;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (xhr.readyState === 4) {
	    cieArr = JSON.parse(xhr.responseText);
	    drawSrcImageAndDiagram(srcImage, srcCanvas, dstCanvas, cieArr);
	}
    };
    xhr.open("GET", file, true); // async:true
    xhr.send(null);
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndDiagram(srcImage, srcCanvas, dstCanvas, cieArr);
	}
	srcImage.src = dataURL;
    }, "DataURL");
}

function drawSrcImageAndDiagram(srcImage, srcCanvas, dstCanvas, cieArr) {
    drawSrcImage(srcImage, srcCanvas);
    drawDiagramBase(dstCanvas, cieArr);
    var hist = getColorHistogram(srcCanvas);
    drawDiagramPoint(dstCanvas, hist);
}

function graphTrans(xy, width, height) {
	var [x, y] = xy;
	return [x * width, (1 - y) * height];
    }
function graphTransRev(xy, width, height) {
	var [x, y] = xy;
	return [x / width, 1 - (y / height)];
    }

function drawDiagramBase(dstCanvas, cieArr) {
    var xyArr = [], rgbArr = [];
    for (var data of cieArr) {
	var [wl, lx, ly, lz] = data;
	lxyz = [lx, ly, lz];
	var xy =  XYZ2xy(lxyz);
	var rgb = XYZ2sRGB(lxyz);
	xyArr.push(xy);
	rgbArr.push(rgb);
    }
    // drawing
    var width = dstCanvas.width, height = dstCanvas.height;
    var ctx = dstCanvas.getContext("2d");
    // axis mapping
    var gxyArr = [];
    for (var i in xyArr) {
	gxyArr.push(graphTrans(xyArr[i], width, height));
    }
    var cxyArr = xyArr2CntlArr(gxyArr);
    // clip definition
    ctx.beginPath();
    for (var i in gxyArr) {
	var [gx, gy] = gxyArr[i];
	var [cx, cy] = cxyArr[i];
	var [r, g, b] = rgbArr[i];
	ctx.strokeStyle= "rgb("+r+","+g+","+b+")";
	if (i >= gxyArr.length - 1) {
	    ctx.lineTo(gx, gy);
	}else {
	    ctx.quadraticCurveTo(cx, cy, gx, gy);
	}
	// console.debug(cx, cy, gx, gy);
    }
    ctx.closePath();
    ctx.clip();
    //
    var offCanvas = document.createElement("canvas");
    var offCtx = offCanvas.getContext("2d");
    offCanvas.width = width ; offCanvas.height = height;
    var imageData = offCtx.createImageData(width, height);
    var data = imageData.data;
    var offset = 0;
    for (var y = 0 ; y < height ; y++) {
	for (var x = 0 ; x < width ; x++) {
	    var xy = graphTransRev([x, y], width, height);
	    var lxyz = xy2XYZ(xy)
	    var [r, g, b] = XYZ2sRGB(lxyz);
	    data[offset++] = r;
	    data[offset++] = g;
	    data[offset++] = b;
	    data[offset++] = 255;
	}
    }
    offCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offCanvas, 0, 0, width, height);
}

function drawDiagramPoint(dstCanvas, hist) {
    var width = dstCanvas.width, height = dstCanvas.height;
    var ctx = dstCanvas.getContext("2d");
    for (var colorId in hist) {
	var [r,g,b,a] = colorId2RGBA(colorId);
	var lxyz = sRGB2XYZ([r,g,b]);
	var xy = XYZ2xy(lxyz);
	var [gx, gy] = graphTrans(xy, width, height);
	ctx.beginPath();
	ctx.fillStyle = "black";
	ctx.arc(gx, gy, 1, 0, 2*Math.PI, true);
	ctx.stroke();
    }
}

