"use strict";
/*
 * 2017/04/05- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    console.debug("cie main()");
    var file = "data/ciexyz64.json";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (xhr.readyState === 4) {
	    cieMain((JSON.parse(xhr.responseText)));
	}
    };
    xhr.open("GET", file, true); // async:true
    xhr.send(null);
}

function cieMain(cieArr) {
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
    var graphCanvas = document.getElementById("graphCanvas");
    var width = graphCanvas.width, height = graphCanvas.height;
    var ctx = graphCanvas.getContext("2d");
    // axis mapping
    var graphTrans = function(xy) {
	var [x, y] = xy;
	return [x * width, (1 - y) * height];
    }
    var graphTransRev = function(xy) {
	var [x, y] = xy;
	return [x / width, 1 - (y / height)];
    }
    for (var i = 0 ; i < 20 ; i++) {
	xyArr.pop(); // XXX
	rgbArr.pop(); // XXX
    }
    // clip definition
    ctx.beginPath();
    for (var i in xyArr) {
	var [gx, gy] = graphTrans(xyArr[i]);
	var [r, g, b] = rgbArr[i];
	ctx.strokeStyle= "rgb("+r+","+g+","+b+")";
	ctx.lineTo(gx, gy);
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
	    var xy = graphTransRev([x, y]);
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
