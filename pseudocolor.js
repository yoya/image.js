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

function makeCLUTfromCRGB(points) {
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
    return table;
}

function makeCLUT() {
    for (var name in CLUTtemplate) {
	var points = CLUTtemplate[name];
	console.debug("name:"+name, points);
        var table = null;
        if (points[0].length === 4) {
            table = makeCLUTfromCRGB(points);
        } else if ((points.length == 256) && (points[0].length === 3)) {
            table = points;
        } else {
            console.error("points.length:"+points.length +", points[0].length:"+points[0].length)
        }
	// console.debug(name, table);
	CLUT[name] = table;
    }
    //
    var randomClut = [];
    for (var i = 0 ; i < 256 ; i++) {
	var r = 0;
	do {
	    r = (Math.random() * 256) | 0;
	} while ((r in randomClut) || (255 < r))
	randomClut[r] = [i,i,i];
    }
    CLUT["random"] = randomClut;
    //
    var contourClut = [];
    for (var i = 0 ; i < 256 ; i++) {
	// var v = (i&1)?0:255
	var v = 127;
	if (i&2) {
	    v = (i&1)?0:255
	}
	contourClut.push([v,v,v]);
    }
    CLUT["contour"] = contourClut;
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
    // https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
    "turbo":[[48,18,59],[50,21,67],[51,24,74],[52,27,81],[53,30,88],[54,33,95],[55,36,102],[56,39,109],[57,42,115],[58,45,121],[59,47,128],[60,50,134],[61,53,139],[62,56,145],[63,59,151],[63,62,156],[64,64,162],[65,67,167],[65,70,172],[66,73,177],[66,75,181],[67,78,186],[68,81,191],[68,84,195],[68,86,199],[69,89,203],[69,92,207],[69,94,211],[70,97,214],[70,100,218],[70,102,221],[70,105,224],[70,107,227],[71,110,230],[71,113,233],[71,115,235],[71,118,238],[71,120,240],[71,123,242],[70,125,244],[70,128,246],[70,130,248],[70,133,250],[70,135,251],[69,138,252],[69,140,253],[68,143,254],[67,145,254],[66,148,255],[65,150,255],[64,153,255],[62,155,254],[61,158,254],[59,160,253],[58,163,252],[56,165,251],[55,168,250],[53,171,248],[51,173,247],[49,175,245],[47,178,244],[46,180,242],[44,183,240],[42,185,238],[40,188,235],[39,190,233],[37,192,231],[35,195,228],[34,197,226],[32,199,223],[31,201,221],[30,203,218],[28,205,216],[27,208,213],[26,210,210],[26,212,208],[25,213,205],[24,215,202],[24,217,200],[24,219,197],[24,221,194],[24,222,192],[24,224,189],[25,226,187],[25,227,185],[26,228,182],[28,230,180],[29,231,178],[31,233,175],[32,234,172],[34,235,170],[37,236,167],[39,238,164],[42,239,161],[44,240,158],[47,241,155],[50,242,152],[53,243,148],[56,244,145],[60,245,142],[63,246,138],[67,247,135],[70,248,132],[74,248,128],[78,249,125],[82,250,122],[85,250,118],[89,251,115],[93,252,111],[97,252,108],[101,253,105],[105,253,102],[109,254,98],[113,254,95],[117,254,92],[121,254,89],[125,255,86],[128,255,83],[132,255,81],[136,255,78],[139,255,75],[143,255,73],[146,255,71],[150,254,68],[153,254,66],[156,254,64],[159,253,63],[161,253,61],[164,252,60],[167,252,58],[169,251,57],[172,251,56],[175,250,55],[177,249,54],[180,248,54],[183,247,53],[185,246,53],[188,245,52],[190,244,52],[193,243,52],[195,241,52],[198,240,52],[200,239,52],[203,237,52],[205,236,52],[208,234,52],[210,233,53],[212,231,53],[215,229,53],[217,228,54],[219,226,54],[221,224,55],[223,223,55],[225,221,55],[227,219,56],[229,217,56],[231,215,57],[233,213,57],[235,211,57],[236,209,58],[238,207,58],[239,205,58],[241,203,58],[242,201,58],[244,199,58],[245,197,58],[246,195,58],[247,193,58],[248,190,57],[249,188,57],[250,186,57],[251,184,56],[251,182,55],[252,179,54],[252,177,54],[253,174,53],[253,172,52],[254,169,51],[254,167,50],[254,164,49],[254,161,48],[254,158,47],[254,155,45],[254,153,44],[254,150,43],[254,147,42],[254,144,41],[253,141,39],[253,138,38],[252,135,37],[252,132,35],[251,129,34],[251,126,33],[250,123,31],[249,120,30],[249,117,29],[248,114,28],[247,111,26],[246,108,25],[245,105,24],[244,102,23],[243,99,21],[242,96,20],[241,93,19],[240,91,18],[239,88,17],[237,85,16],[236,83,15],[235,80,14],[234,78,13],[232,75,12],[231,73,12],[229,71,11],[228,69,10],[226,67,10],[225,65,9],[223,63,8],[221,61,8],[220,59,7],[218,57,7],[216,55,6],[214,53,6],[212,51,5],[210,49,5],[208,47,5],[206,45,4],[204,43,4],[202,42,4],[200,40,3],[197,38,3],[195,37,3],[193,35,2],[190,33,2],[188,32,2],[185,30,2],[183,29,2],[180,27,1],[178,26,1],[175,24,1],[172,23,1],[169,22,1],[167,20,1],[164,19,1],[161,18,1],[158,16,1],[155,15,1],[152,14,1],[149,13,1],[146,11,1],[142,10,1],[139,9,2],[136,8,2],[133,7,2],[129,6,2],[126,5,2],[122,4,3]],
    "red-green"  : [ [0, 255, 0, 0], [255, 0 , 255, 0] ],
    "blue-yellow": [ [0, 0, 0, 255] , [255, 255, 255, 0] ],
    "red":   [ [0, 0, 0, 0], [255, 255, 0, 0] ],
    "green": [ [0, 0, 0, 0], [255, 0, 255, 0] ],
    "blue":  [ [0, 0, 0, 0], [255, 0, 0, 255] ],
    "cyan":    [ [0, 0, 0, 0], [255, 0, 255, 255,] ],
    "magenta": [ [0, 0, 0, 0], [255, 255, 0, 255,] ],
    "yellow":  [ [0, 0, 0, 0], [255, 255, 255, 0,] ],
    "sepia":  [ [0, 0, 0, 0]    , [255, 255, 255, 237] ], // CSS
    "sepia2": [ [0, 107, 74, 43], [255, 255, 255, 255] ], // sepia to white
    "sepia3": [ [0, 107, 74, 43], [255, 255, 255, 237] ]  // sepia to CSS sepia-white
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
