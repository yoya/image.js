"use strict";
/*
 * 2017/04/05- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function xy2XYZ(xy) {
    var [x, y] = xy;
    var ly = y;
    var lx = (x / y) * ly
    var z = (1 - x - y) / y * ly;
    return [x, y, z];
}
//  http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ_RGB.html

function XYZ2xy(lxyz) {
    var [lx, ly, lz] = lxyz;
    var x = lx / (lx + ly + lz);
    var y = ly / (lx + ly + lz);
    return [x, y];
}

function XYZ2sRGB(lxyz) {
    var [lx, ly, lz] = lxyz;
    // linear sRGB
    var lr =  3.2410 * lx - 1.5374 * ly - 0.4986 * lz;
    var lg = -0.9692 * lx + 1.8760 * ly + 0.0416 * lz;
    var lb =  0.0556 * lx - 0.2040 * ly + 1.0570 * lz;
    var rgb = [];
    // gamma
    for (var lv of [lr, lg, lb]) {
	if (lv < 0.031308) {
	    var v = 12.92 * lv;
	} else {
	    var v = 1.055 * Math.pow(lv, 1/2.4) - 0.055;
	}
	v *= 255;
	if (v < 0) {
	    v = 0;
	} else if (255 < v) {
	    v = 255;
	}
	rgb.push(v >>> 0);
    }
    return rgb;
}

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
    var xyRgbArr = [];
    for (var data of cieArr) {
	var [wl, lx, ly, lz] = data;
	lxyz = [lx, ly, lz];
	var xy =  XYZ2xy(lxyz);
	var rgb = XYZ2sRGB(lxyz);
	xyRgbArr.push({xy:xy, rgb:rgb});
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
    var [px, py] = graphTrans(xyRgbArr[1].xy);
    for (var i = 0 ; i < 20 ; i++) {
	xyRgbArr.pop(); // XXX
    }
    // clip definition
    ctx.beginPath();
    for (var xyRgb of xyRgbArr) {
	var [gx, gy] = graphTrans(xyRgb.xy);
	var [r, g, b] = xyRgb.rgb;
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
