"use strict";
/*
 * 2018/01/18- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    var elaspe = 500; // msec
    // console.debug("main");
    var dstCanvas = document.getElementById("dstCanvas");
    dstCanvas.style.backgroundColor = "black";
    var levelDownButton = document.getElementById("levelDownButton");
    var levelUpButton = document.getElementById("levelUpButton");
    var levelRange = document.getElementById("levelRange");
    var colorsRange = document.getElementById("colorsRange");
    var gapCheckbox = document.getElementById("gapCheckbox");
    var level = parseFloat(levelRange.value);
    var colors = parseFloat(colorsRange.value);
    var gapTable = gapCheckbox.checked?getGapTable(level):null;
    var params = { level: level,
		   colors: colors,
		   orderTableRev: getOrderTableRev(level),
		   gapTable: gapTable,
		   elaspe: elaspe};
    bindFunction({"widthHeightRange":"widthHeightText",
		  "gapCheckbox":null,
		  "soundCheckbox":null
		 },
		 function(target, rel) {
		     var id = target.id;
		     if (id === "gapCheckbox") {
			 gapTable = gapCheckbox.checked?getGapTable(level):null;
			 params['gapTable'] = gapTable;
		     }
		     if (id === "soundCheckbox") {
			 params['sound'] = target.checked;
		     }
		      drawSpaceFilling(dstCanvas, params);
		  } );
    bindFunction({"levelDownButton":null, "levelUpButton":null,
		  "levelRange":"levelText",
		  },
		 function(target, rel) {
		     var id = target.id;
		     if (id === "levelDownButton") {
			 levelRange.value--;
		     } else if (id === "levelUpButton") {
			 levelRange.value++;
		     }
		     var level = parseFloat(levelRange.value);
		     levelText.value = level;
		     params['level'] = level
		     params['orderTableRev'] = getOrderTableRev(level);
		     gapTable = gapCheckbox.checked?getGapTable(level):null;
		     params['gapTable'] = gapTable;
		     drawSpaceFilling(dstCanvas, params);
		 } );
    bindFunction({"colorsDownButton":null, "colorsUpButton":null,
		  "colorsRange":"colorsText",
		  },
		 function(target, rel) {
		     var id = target.id;
		     if (id === "colorsDownButton") {
			 colorsRange.value--;
		     } else if (id === "colorsUpButton") {
			 colorsRange.value++;
		     }
		     var colors = parseFloat(colorsRange.value);
		     colorsText.value = colors;
		     params['colors'] = colors;
		     drawSpaceFilling(dstCanvas, params);
		 } );
    var timerId = null;
    bindFunction({"playButton":null, "stopButton":null },
		 function(target, rel) {
		     var id = target.id;
		     if (timerId) {
			 clearInterval(timerId);
			 timerId = null;
		     }
		     if (id === "playButton") {
			 params['cursol'] = 0;
			 var ctx = new function() {
			     this.canvas = dstCanvas;
			     this.params = params;
			     this.cursol = 0;
			 }
			 timerId = setInterval(playSpaceFilling.bind(ctx), elaspe);
		     } else if (id === "colorsUpButton") {
			 if (timerId) {
			     clearInterval(timerId);
			 }
		     }
		 } );
    drawSpaceFilling(dstCanvas, params);
}

function getOrderTable(level) {
    var tableWidth = Math.pow(2, level);
    var tableHeight = tableWidth;
    var tableLength = tableWidth * tableHeight
    var orderTable = new Uint32Array(tableLength);
    // getOrderTable_Regular(orderTable);
    getOrderTable_Hilbert(orderTable, level, tableWidth);
    return orderTable;
}

function getOrderTableRev(level) {
    var orderTable = getOrderTable(level);
    var orderTableRev = new Array(orderTable.length);
    for (var i = 0, n = orderTable.length ; i < n ; i++) {
	var order = orderTable[i];
	if ((i !== 0) && (order === 0)) {
	    continue;
	}
	if (order in orderTableRev) {
	    ;
	} else {
	    orderTableRev[order] = i;
	}
    }
    return orderTableRev;
}

function getOrderTable_Regular(orderTable) {
    for (var i = 0, n = orderTable.length ; i < n ; i++) {
	orderTable[i] = i;
    }
}

function getOrderFromXY(x, y, size) {
    return x + y * size;
}

/* orient
   0:  1:(rot90) 2:(rot180) 3:(rot270) - regular
   0 1   3 0       2 3        1 2
   3 2   2 1       1 0        0 3
   4:  5:(rot90) 6:(rot180) 7:(rot270) - reverse
   0 3   1 0       2 1        3 2
   1 2   2 3       3 0        0 1
*/

function copyWithOrient(orderTable, dstX, dstY, tableWidth, unitWidth, 
			orient, plus) {
    var dx = 0, dy = 0;
    var rotFuncs = {
	0: function(x, y) { return [x, y]; },
	1: function(x, y) { return [unitWidth-1-y, x]; },
	2: function(x, y) { return [unitWidth-1-x, unitWidth-1-y]; },
	3: function(x, y) { return [y, unitWidth-1-x]; },
	4: function(x, y) { return [y, x]; },
	5: function(x, y) { return [unitWidth-1-x, y]; },
	6: function(x, y) { return [unitWidth-1-y, unitWidth-1-x]; },
	7: function(x, y) { return [x, unitWidth-1-y]; },
    };
    for (var y = 0 ; y < unitWidth ; y++) {
	for (var x = 0 ; x < unitWidth ; x++) {
	    var [x2, y2] = rotFuncs[orient](x, y);
	    orderTable[getOrderFromXY(dstX + x2, dstY + y2, tableWidth)] = orderTable[getOrderFromXY(x, y, tableWidth)] + plus;
	}
    }1
}

function getOrderTable_Hilbert(orderTable, level, tableWidth) {
    var orient = 0;
    var dir = 0;
    orderTable[0] = 0;
    for (var currLevel = 1 ; currLevel <= level ; currLevel++) {
	var unitSize = Math.pow(2, currLevel) / 2;
	var plus = unitSize*unitSize;
	if (currLevel % 2) {
	    copyWithOrient(orderTable, unitSize, 0,        tableWidth, unitSize, 4, plus);
	    copyWithOrient(orderTable, unitSize, unitSize, tableWidth, unitSize, 4, plus*2);
	    copyWithOrient(orderTable, 0, unitSize,        tableWidth, unitSize, 2, plus*3);
	} else {
	    copyWithOrient(orderTable, unitSize, 0,        tableWidth, unitSize, 2, plus*3);
	    copyWithOrient(orderTable, unitSize, unitSize, tableWidth, unitSize, 4, plus*2);
	    copyWithOrient(orderTable, 0, unitSize,        tableWidth, unitSize, 4, plus);
	}
    }
}

function getGapTable(level) {
    var width = Math.pow(2, level);
    var len = width * width * 2; // 2 = count([x.y]);
    var gapTable = new Float32Array(len);
    for (var i = 0; i < len ; i++) {
	gapTable[i] = Math.random() * 5 - 2.5;
    }
    return gapTable;
}

function getOrderXY(order, level) {
    var size = Math.pow(2, level);
    var orderX = order % size;
    var orderY = (order - orderX) / size;
    return [orderX, orderY];
}

function getPosition(order, level, width, height) {
    var size = Math.pow(2, level);
    var unitX = width / size;
    var unitY = height / size;
    var [orderX, orderY] = getOrderXY(order, level);
    var x = orderX * unitX + unitX / 2;
    var y = orderY * unitY + unitY / 2;
    return [x, y];
}


function drawSpaceFilling(canvas, params) {
    var red          = "rgb(255,  64,  64)";
    var orange       = "rgb(255, 127,   0)";
    var yellow       = "rgb(255, 255,   0)";
    var yellowgreen  = "rgb(172, 255  , 0)";
    var green        = "rgb(  0, 255, 172)";
    var blue         = "rgb(100, 127, 255)";
    var violet       = "rgb(200, 100, 255)";
    var colorArrArr = [
	[],
	[green],
	[red, blue],
	[red, green, blue],
	[red, yellow, green, blue],
	[red, yellow, green, blue, violet],
	[red, orange, yellow, green, blue, violet],
	[red, orange, yellow, yellowgreen, green, blue, violet],
    ];
    var widthHeight = parseFloat(document.getElementById("widthHeightRange").value);
    var level = params['level'];
    var colors = params['colors'];
    var orderTableRev = params['orderTableRev'];
    var gapTable = params['gapTable'];
    var width = widthHeight;
    var height = widthHeight;
    canvas.width = width;
    canvas.height = height;
    // console.debug("drawSpaceFilling");
    var ctx = canvas.getContext("2d");
    var [x, y] = getPosition(0, level, width, height);
    ctx.beginPath();
    ctx.strokeStyle = colorArrArr[colors][0];
    ctx.lineWidth = 1;
    ctx.arc(x, y, 3, 0, 2*Math.PI , false);x
    ctx.stroke();
    // console.log(orderTableRev);
    var [prevX, prevY] = [x, y];
    for (var i = 1, n = orderTableRev.length ; i < n ; i++) {
	var order = orderTableRev[i];
	if ((i > 0) && (! order)) {
	    continue;
	}
	ctx.beginPath();
	var colorArr = colorArrArr[colors];
	if (gapTable) {
	    ctx.moveTo(prevX + gapTable[i],
		       prevY + gapTable[n + i]);
	} else {
	    ctx.moveTo(prevX, prevY);
	}
	[x, y] = getPosition(order, level, width, height);
	//ctx.strokeStyle = colorArr[i % colorArr.length];
	var [orderX, orderY] = getOrderXY(order, level);
	if (prevX == x) {
	    ctx.strokeStyle = colorArr[orderX % colorArr.length];
	} else {
	    ctx.strokeStyle = colorArr[orderY % colorArr.length];
	}
	ctx.lineTo(x, y);
	ctx.arc(x, y, 3, 0, 2*Math.PI , false);
	ctx.stroke();
	var [prevX, prevY] = [x, y];
    }
}

function getScale(order) {
    var scaleTable = [40, 44, 47];
    var scaleNum = scaleTable.length;
    var scale = scaleTable[order % scaleNum];
    var octave = (order - (order % scaleNum)) / scaleNum;
    return scale + octave * 12;
}

function drawCursolAnimation() {
    var ratio = this.ratio;
    if (ratio >= 1.0) {
	var order = this.order2
	var level = this.level;
	clearInterval(this.timerId);
	if (this.sound) {
	    var [orderX, orderY] = getOrderXY(order, level);
	    noteOn(getScale(orderX), 0.5);
	    noteOn(getScale(orderY), 0.5);
	}
    }
    var canvas = this.canvas;
    var [x1, y1] = [this.x1, this.y1];
    var [x2, y2] = [this.x2, this.y2];
    var ctx = canvas.getContext("2d");
    var x = x1 * (1 - ratio) + x2 * ratio;
    var y = y1 * (1 - ratio) + y2 * ratio;
    ctx.beginPath();
    var v = Math.floor(ratio * 255);
    ctx.strokeStyle = "rgb(" + [v,v,v].join(',')+")";
    ctx.arc(x, y, 10 * ratio, 0, 2*Math.PI , false);
    ctx.stroke();
    this.ratio += this.step;
}

function drawCursol(canvas, params, cursol) {
    var level = params['level'];
    var orderTableRev = params['orderTableRev'];
    var width = canvas.width;
    var height = canvas.height;
    var order1 = (cursol <= 0)?orderTableRev[cursol]:orderTableRev[cursol-1];
    var order2 = orderTableRev[cursol];
    var [x1, y1] = getPosition(order1, level, width, height);
    var [x2, y2] = getPosition(order2, level, width, height);
    var ctx = new function() {
	this.canvas = dstCanvas;
	this.x1 = x1;  this.y1 = y1;
	this.x2 = x2;  this.y2 = y2;
	this.ratio = 0;
	this.step = 0.1;
	this.order1 = order1;
	this.order2 = order2;
	this.level = params['level'];
	this.sound = params['sound'];
    }
    var elapse = 300 * ctx.step;
    ctx.timerId = setInterval(drawCursolAnimation.bind(ctx), elapse);
}

function playSpaceFilling() {
    var canvas = this.canvas;
    var params = this.params;
    var cursol = this.cursol;
    var orderTableRev = params['orderTableRev'];
    if (cursol <=  orderTableRev.length) {
	drawSpaceFilling(canvas, params);
	if (cursol <  orderTableRev.length) {
	    drawCursol(canvas, params, cursol);
	    this.cursol++;
	}
    }
}
