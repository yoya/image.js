"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 * 2018/02/20- (c) yoya@awm.jp from ../cie.js
 */

var tristimulus_XYs_Table = {
    //http://flat-display-2.livedoor.biz/archives/50594042.html
    // https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space
    'srgb':    [[0.640, 0.330], [0.300, 0.600], [0.150, 0.060]],
    'dcip3':   [[0.680, 0.320], [0.265, 0.690], [0.150, 0.060]],
    'adobe':   [[0.640, 0.330], [0.210, 0.710], [0.150, 0.060]],
    'prophoto':[[0.7347, 0.2653], [0.1596, 0.8404], [0.0366, 0.0001]],
}

var loadCIEXYZdata = function(callback) {
    var cieDefault = "cie31Arr"; // cieSelect as default
    var cieTable = {"cie31Arr":"data/ciexyz31.json",
                    "cie64Arr":"data/ciexyz64.json",
                    "cieJVArr":"data/ciexyzjv.json"};
    for (var cie in cieTable) {
	var file = cieTable[cie];
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	    if (this.readyState === 4) {
		var cie = this.cie;
		var arr = JSON.parse(this.responseText);
		var arr = arr.filter(function(e) {
		    var lw =  e[0]; // length of wave
		    return (370 < lw) && (lw < 720);
		});
		if (cie == cieDefault) {
		    callback(cie, arr, true);
		} else {
		    callback(cie, arr, false);
		}
	    }
	};
	xhr.cie = cie;
	xhr.open("GET", file, true); // async:true
	xhr.send(null);
	xhr = null;
    }
}

function drawSpectrumGraph(canvas, params) {
    canvas.width  = canvas.width ; // clear
    drawSpectrumGraphBase(canvas, params);
    drawSpectrumGraphCMF(canvas, params);
}

function graphTrans(xy, width, height) {
    var [x, y] = xy;
    return [x * width, (1 - y) * height];
}

function graphTransRev(xy, width, height) {
    var [x, y] = xy;
    return [x / width, 1 - (y / height)];
}

function drawDiagramBase(dstCanvas, params) {
    var cieArr       = params['cieArr'];
    var chromaticity = params['chromaticity'];
    var colorspace   = params['colorspace'];
    var tristimulus  = params['tristimulus'];
    var guide        = params['guide'];
    var caption      = params['caption'];
    var normalize    = params['normalize'];
    dstCanvas.width = dstCanvas.width;
    var xyArr = [], rgbArr = [];
    for (var i = 0, n = cieArr.length ; i < n; i++) {
	var data = cieArr[i];
	var [wl, lx, ly, lz] = data;
	lxyz = [lx, ly, lz];
	var xy =  XYZ2xy(lxyz);
	var rgb = XYZ2sRGB(lxyz);
	if (chromaticity === "ciexy") {
	    xyArr.push(xy);
	} else {
	    var uava = xy2uava(xy);
	    xyArr.push(uava);
	}
	rgbArr.push(rgb);
    }
    // drawing
    var width = dstCanvas.width, height = dstCanvas.height;
    var ctx = dstCanvas.getContext("2d");
    ctx.save();

    if (guide) { // draw axis
	for (var x = 0 ; x <= 10 ; x++) {
	    var [x1, y1] = graphTrans([x/10, 0], width, height);
	    var [x2, y2] = graphTrans([x/10, 1], width, height);
	    ctx.beginPath();
	    if (x%5 === 0){
		ctx.strokeStyle= "lightgray";
	    } else {
		ctx.strokeStyle= "gray";
	    }
	    ctx.moveTo(x1, y1);
	    ctx.lineTo(x2, y2);
	    ctx.stroke();
	}
	for (var y = 0 ; y <= 10 ; y++) {
	    var [x1, y1] = graphTrans([0, y/10], width, height);
	    var [x2, y2] = graphTrans([1, y/10], width, height);
	    ctx.beginPath();
	    if (y%5 === 0){
		ctx.strokeStyle= "lightgray";
	    } else {
		ctx.strokeStyle= "gray";
	    }
	    ctx.moveTo(x1, y1);
	    ctx.lineTo(x2, y2);
	    ctx.stroke();
	}
    }
    // geometry mapping
    var gxyArr = [];
    for (var i in xyArr) {
	gxyArr.push(graphTrans(xyArr[i], width, height));
    }
    var cxyArr = xyArr2CntlArr(gxyArr);

    ctx.save(); // spectrum color filling begin
    // clip definition
    ctx.beginPath();
    for (var i = 0, n = gxyArr.length ; i < n; i++) {
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
	    if (chromaticity === "ciexy") {
		var lxyz = xy2XYZ(xy)
	    } else {
		xy = uava2xy(xy);
		var lxyz = xy2XYZ(xy);
	    }
	    var rgb = XYZ2sRGB(lxyz);
	    //
	    var r, g, b;
	    if (normalize === "distance") {
		[r, g, b] = normalizeRGBA_distance(rgb);
	    } else {
		[r, g, b] = normalizeRGBA_max(rgb);
	    }
	    data[offset++] = r;
	    data[offset++] = g;
	    data[offset++] = b;
	    data[offset++] = 255;
	}
    }
    offCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offCanvas, 0, 0, width, height);
    ctx.restore(); // spectrum color filling end

    if (tristimulus) {
	// ctx.globalCompositeOperation = "lighter";
	ctx.beginPath();
	ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
	ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
	var tristimulus_XYs;
	if (Array.isArray(tristimulus)) {
	    tristimulus_XYs = tristimulus;
	} else {
	    tristimulus_XYs = tristimulus_XYs_Table[colorspace];
	}
	for (var i in tristimulus_XYs) {
	    var xy = tristimulus_XYs[i];
	    if (chromaticity !== "ciexy") {
		xy = xy2uava(xy);
	    }
	    var [gx, gy] = graphTrans(xy, width, height);
	    if (i === 0) {
		ctx.moveTo(gx, gy);
	    } else {
		ctx.lineTo(gx, gy);
	    }
	}
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
    }
    ctx.restore();
    if (caption) {
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.fillText(caption, width/2, 0);
    }
}

function drawDiagramPoints(canvas, params) {
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;
    var drawPoints = params['drawPoints'];
    if (drawPoints) {
	for (var i in drawPoints) {
	    var point = drawPoints[i];
	    var stroke = point.stroke, fill = point.fill, xy = point.xy;
	    ctx.beginPath();
	    ctx.strokeStyle = stroke;
	    ctx.fillStyle = fill;
	    ctx.lineWidth = 0.5;
	    var [gx, gy] = graphTrans(xy, width, height);
	    ctx.arc(gx, gy, 6, 0, 2*Math.PI, false);
	    ctx.stroke();
	    ctx.fill();
	}
    }
}

function drawSpectrumGraphBase(canvas, params) {
    var cieArr   = params['cieArr'];
    var guide    = params['guide'];
    canvas.style.backgroundColor = "black";
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext("2d");
    var arrLen = cieArr.length;
    var xyRatioTable = [];
    var maxValue = 0;
    var grad = ctx.createLinearGradient(0, 0, width, 0);
    // spectrum gradient
    for (var i in cieArr) {
	var [wl, lx, ly, lz] = cieArr[i];
	if (wl <= 445) {
	    // wl: 445
	    var [x, y, z] = [0.348060000000,0.029800000000,1.782600000000];
	    var a = lz / 1.782600000000;
	} else if (wl < 605) {
	    var [x, y, z] = [lx, ly, lz];
	    var a = 1.0;
	} else {
	    // wl: 605
	    var [x, y, z] = [1.045600000000,0.566800000000,0.000600000000];
	    var a = lx / 1.045600000000;
	}
	var lrgb = XYZ2RGB([x, y, z]);
	var [r, g, b] = linearRGB2sRGB(lrgb);
	var color = "rgba("+r+","+g+","+b+","+a+")";
	grad.addColorStop(i / arrLen, color);
    }
    ctx.fillStyle = grad;
    ctx.rect(0, 0, width, height);
    ctx.fill();
    if (guide) { // axis
	for (var i in cieArr) {
	    var [wl, lx, ly, lz] = cieArr[i];
	    var x = width * i / arrLen;
	    if ((wl % 50) === 0) {
		ctx.beginPath();
		if ((wl % 100) === 0) {
		    ctx.strokeStyle= "rgb(127,127,127)";
		} else {
		    ctx.strokeStyle= "rgba(127,127,127, 0.3)";
		}
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	    }
	}
    }
}

function drawSpectrumGraphCMF(canvas, params) {
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext("2d");
    var cieArr   = params['cieArr'];
    var arrLen = cieArr.length;
    var lxArr = new Float32Array(arrLen);
    var lyArr = new Float32Array(arrLen);
    var lzArr = new Float32Array(arrLen);
    // color matching function
    for (var i in cieArr) {
	var [wl, lx, ly, lz] = cieArr[i];
	lxArr[i] = lx;
	lyArr[i] = ly;
	lzArr[i] = lz;
    }
    var lxMax = Math.max.apply(null, lxArr);
    var lyMax = Math.max.apply(null, lyArr);
    var lzMax = Math.max.apply(null, lzArr);
    var lMax = Math.max.apply(null, [lxMax, lyMax, lzMax]);
    var lxMin = Math.min.apply(null, lxArr);
    var lyMin = Math.min.apply(null, lyArr);
    var lzMin = Math.min.apply(null, lzArr);
    var lMin = Math.min.apply(null, [lxMin, lyMin, lzMin]);
    var graphLines = [["#F88", lxArr], ["#AFA", lyArr], ["#88F", lzArr]];
    // ctx.globalCompositeOperation = "lighter";
    for (var i in graphLines) {
	var [color, arr] = graphLines[i];
	ctx.strokeStyle = color;
	ctx.lineWidth = 3;
	ctx.beginPath();
	for (var j = 0, n = arr.length ; j < n ; j++) {
	    var x = width * j / n;
	    var y = height * (1 - (arr[j]-lMin) / (lMax-lMin));
            if (j == 0) {
	        ctx.moveTo(x, y);
            } else {
	        ctx.lineTo(x, y);
            }
	}
	ctx.stroke();
    }
}
