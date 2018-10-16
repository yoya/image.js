"use strict";
/*
 * 2017/06/12- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var clutCanvas = document.getElementById("clutCanvas");
    var srcCanvas = document.getElementById("srcCanvas");
    var grayCanvas = document.getElementById("grayCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var clutType = document.getElementById("clutTypeSelect").value;
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawClutTable(clutCanvas, clutType);
	    drawSrcImageAndPseudoColor(srcImage, srcCanvas, grayCanvas, dstCanvas, clutType);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "clutTypeSelect":null},
		 function() {
		     clutType = document.getElementById("clutTypeSelect").value;
		     drawClutTable(clutCanvas, clutType);
		     drawSrcImageAndPseudoColor(srcImage, srcCanvas, grayCanvas, dstCanvas, clutType);
		 } );
    makeCLUT();
    drawClutTable(clutCanvas, clutType);
}

function makeCLUT() {
    for (var name in CLUTtemplate) {
	var points = CLUTtemplate[name];
	// console.debug("name:"+name, points);
	var table = [];
	for (var j = 0 ; j < 256 ; j++) {
	    var prevRatio = 0, nextRatio = 0
	    var prevIndex = 0, nextIndex = 0;
	    for (var k = prevIndex, n = points.length ; k < n ; k++) {
		var point = points[k];
		var ratio = point[0];
		if (ratio <= j) {
		    prevRatio = ratio;
		    prevIndex = k;
		}
		if (j <= ratio) {
		    nextRatio = ratio;
		    nextIndex = k;
		    break;
		}
	    }
	    var prevRGB = points[prevIndex];
	    if ( prevRatio < nextRatio) {
		var nextRGB = points[nextIndex];
		var r = (j - prevRatio) / (nextRatio - prevRatio);
		var lPrevRGB = sRGB2linearRGB(prevRGB.slice(1));
		var lNextRGB = sRGB2linearRGB(nextRGB.slice(1));
		var lrgb = [
		    (1-r)*lPrevRGB[0] + r*lNextRGB[0],
		    (1-r)*lPrevRGB[1] + r*lNextRGB[1],
		    (1-r)*lPrevRGB[2] + r*lNextRGB[2]
		];
		var rgb = linearRGB2sRGB(lrgb);
	    } else {
		var rgb = prevRGB.slice(1);
	    }
	    table.push(rgb);
	}
	// console.debug(name, table);
	CLUT[name] = table;
    }
    var randomClut = [];
    for (var i = 0 ; i < 256 ; i++) {
	var r = 0;
	do {
	    r = (Math.random() * 256) | 0;
	} while ((r in randomClut) || (255 < r))
	randomClut[r] = [i,i,i];
    }
    console.log(randomClut);
    randomClut = randomClut.sort(function() { Math.random() - 0.5; });
    console.log(randomClut);
    CLUT["random"] = randomClut;
}

var CLUTtemplate = {
    // 色彩工学入門(森北出版) p191
    "fire":[
	[0,    0,  0,150], // deepblue
	[30,   0,  0,255], // blue
	[80, 210,  0,210], // violet
	[100,230,  0,  0], // red
	[180,255,200,  0], // orange
	[220,255,255,  0], // yellow
	[255,255,255,255]  // white
    ],
    "ice":[  // ?????
	[0,     0,200,  0], // green
	[60,    0,100,255], // blue
	[120, 200, 50,250], // violet
	[170, 230, 50,200], // purple
	[230, 230, 50,100], // pink
	[240, 240, 50,  0], // orange
	[255, 255,  0,  0]  // red
    ],
    "rainbow": [
	[0,  255,  0,  0], // red
	[50, 230,230,  0], // yellow
	[100,  0,200,  0], // green
	[130,  0,200,200], // green -cyan
	[160,  0,150,255], // cyan - blue
	[200,  0,  0,255], // blue
	[240, 255, 0,255], // violet
	[255, 255, 0,  0]  // red
    ],
    "red-green"  : [ [0, 255, 0, 0], [255, 0 , 255, 0] ],
    "blue-yellow": [ [0, 0, 0, 255] , [255, 255, 255, 0] ],
    "red":   [ [0, 0, 0, 0], [255, 255, 0, 0] ],
    "green": [ [0, 0, 0, 0], [255, 0, 255, 0] ],
    "blue":  [ [0, 0, 0, 0], [255, 0, 0, 255] ],
    "cyan":    [ [0, 0, 0, 0], [255, 0, 255, 255,] ],
    "magenta": [ [0, 0, 0, 0], [255, 255, 0, 255,] ],
    "yellow":  [ [0, 0, 0, 0], [255, 255, 255, 0,] ]
};

var CLUT = { }; // from CUTtemplate;

function drawClutTable(canvas, clutType) {
    // console.debug("drawClutTable:", canvas, clutType);
    var table = CLUT[clutType];
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;
    var grad = ctx.createLinearGradient(0, 0, width, 0);
    for (var i = 0 ; i < 256 ; i++) {
	var [r,g,b] = table[i];
	var color = "rgb("+r+","+g+","+b+")";
	grad.addColorStop(i / 255, color);
    }
    ctx.fillStyle = grad;
    ctx.rect(0, 0, width, height);
    ctx.fill();
}

function drawSrcImageAndPseudoColor(srcImage, srcCanvas, grayCanvas, dstCancas, clutType) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGrayImage(srcCanvas, grayCanvas);
    drawPseudoColor(grayCanvas, dstCanvas, clutType);
}

function pseudoColor(v, clutType) {
    return CLUT[clutType][v];
}

function drawPseudoColor(grayCanvas, dstCanvas, clutType) {
    // console.debug("drawPseudoColor");
    var grayCtx = grayCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var width = grayCanvas.width, height = grayCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    var grayImageData = grayCtx.getImageData(0, 0, width, height);
    var dstImageData = dstCtx.createImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var [r, g, b, a] = getRGBA(grayImageData, x, y);
	    [r, g, b] = pseudoColor(g, clutType);
	    setRGBA(dstImageData, x, y, [r,g,b,a]);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
