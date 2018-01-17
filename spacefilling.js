"use strict";
/*
 * 2018/01/18- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var dstCanvas = document.getElementById("dstCanvas");
    dstCanvas.style.backgroundColor = "black";
    var level = 2;
    bindFunction({"widthHeightRange":"widthHeightText",
		  "levelRange":"levelText"},
		 function() {
		     drawSpaceFilling(dstCanvas, level);
		 } );
    drawSpaceFilling(dstCanvas);
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

function getPosition(order, level, width, height) {
    var size = Math.pow(2, level);
    var unitX = width / size;
    var unitY = height / size;
    var orderX = order % size;
    var orderY = (order - orderX) / size;
    var x = orderX * unitX + unitX / 2;
    var y = orderY * unitY + unitY / 2;
    return [x, y];
}

function drawSpaceFilling(canvas) {
    var widthHeight = parseFloat(document.getElementById("widthHeightRange").value);
    var level = parseFloat(document.getElementById("levelRange").value);
    var width = widthHeight;
    var height = widthHeight;
    canvas.width = width;
    canvas.height = height;
    // console.debug("drawSpaceFilling");
    var orderTable = getOrderTable(level);
    var ctx = canvas.getContext("2d");
    var [x, y] = getPosition(0, level, width, height);
    ctx.beginPath();
    ctx.strokeStyle = "rgb(255, 0, 0)";
    ctx.lineWidth = 1;
    ctx.arc(x, y, 3, 0, 2*Math.PI , false);
    ctx.stroke();
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
    console.log(orderTable);
    console.log(orderTableRev);
    var [prevX, prevY] = [x, y];
    for (var i = 1, n = orderTableRev.length ; i < n ; i++) {
	var order = orderTableRev[i];
	if ((i > 0) && (! order)) {
	    continue;
	}
	ctx.beginPath();
	ctx.strokeStyle = ["rgb(255, 127, 127)", "rgb(255,255, 0)","rgb(0, 240, 0)", "rgb(127, 127, 255)" ][i%4];
	ctx.moveTo(prevX, prevY);
	[x, y] = getPosition(order, level, width, height);
	ctx.lineTo(x, y);
	ctx.arc(x, y, 3, 0, 2*Math.PI , false);
	ctx.stroke();
	var [prevX, prevY] = [x, y];
    }
}

