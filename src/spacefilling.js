'use strict';
/*
 * 2018/01/18- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const dstCanvas = document.getElementById('dstCanvas');
    dstCanvas.style.backgroundColor = 'black';
    const levelDownButton = document.getElementById('levelDownButton');
    const levelUpButton = document.getElementById('levelUpButton');
    const levelRange = document.getElementById('levelRange');
    const colorsRange = document.getElementById('colorsRange');
    const gapCheckbox = document.getElementById('gapCheckbox');
    const volumeRange = document.getElementById('volumeRange');
    const tempoRange = document.getElementById('tempoRange');
    const scaleSelect = document.getElementById('scaleSelect');
    const level = parseFloat(levelRange.value);
    const colors = parseFloat(colorsRange.value);
    let volume = parseFloat(volumeRange.value);
    let tempo = parseFloat(tempoRange.value);
    let scaleString = scaleSelect.value;
    let elapse = 60 / tempo * 1000 / 2;
    let gapTable = gapCheckbox.checked ? getGapTable(level) : null;
    const params = {
 level: level,
		   colors: colors,
		   orderTableRev: getOrderTableRev(level),
		   gapTable: gapTable,
		   elapse: elapse,
		   volume:volume,
		   tempo:tempo,
		   scaleString:scaleString,
		   cancel:false
};
    bindFunction({
'widthHeightRange':'widthHeightText',
		  'gapCheckbox':null,
		  'volumeRange':'volumeText',
		  'tempoRange':'tempoText',
		  'scaleSelect':null
		 },
		 function(target, rel) {
		     const id = target.id;
		     if (id === 'gapCheckbox') {
			 gapTable = gapCheckbox.checked ? getGapTable(level) : null;
			 params.gapTable = gapTable;
		     } else if ((id === 'volumeRange') || (id === 'volumeText')) {
			 volume = parseFloat(volumeRange.value);
			 params.volume = volume;
		     } else if ((id === 'tempoRange') || (id === 'tempoText')) {
			 tempo = parseFloat(tempoRange.value);
			 elapse = 60 / tempo * 1000 / 2; // 8th note
			 params.tempo = tempo;
			 params.elapse = elapse;
		     } else if (id === 'scaleSelect') {
			 scaleString = scaleSelect.value;
			 params.scaleString = scaleString;
		     }
		     drawSpaceFilling(dstCanvas, params);
		  });
    bindFunction({
 'levelDownButton':null,
'levelUpButton':null,
		  'levelRange':'levelText'
		  },
		 function(target, rel) {
		     const id = target.id;
		     if (id === 'levelDownButton') {
			 levelRange.value--;
		     } else if (id === 'levelUpButton') {
			 levelRange.value++;
		     }
		     const level = parseFloat(levelRange.value);
		     levelText.value = level;
		     params.level = level;
		     params.orderTableRev = getOrderTableRev(level);
		     gapTable = gapCheckbox.checked ? getGapTable(level) : null;
		     params.gapTable = gapTable;
		     drawSpaceFilling(dstCanvas, params);
		 });
    bindFunction({
'colorsDownButton':null,
'colorsUpButton':null,
		  'colorsRange':'colorsText'
		  },
		 function(target, rel) {
		     const id = target.id;
		     if (id === 'colorsDownButton') {
			 colorsRange.value--;
		     } else if (id === 'colorsUpButton') {
			 colorsRange.value++;
		     }
		     const colors = parseFloat(colorsRange.value);
		     colorsText.value = colors;
		     params.colors = colors;
		     drawSpaceFilling(dstCanvas, params);
		 });
    let timerId = null;
    bindFunction({ 'playButton':null, 'stopButton':null },
		 function(target, rel) {
		     const id = target.id;
		     if (timerId) {
			 clearInterval(timerId);
			 timerId = null;
		     }
		     if (id === 'playButton') {
			 params.cancel = false;
			 params.cursol = 0;
			 const ctx = new function() {
			     this.canvas = dstCanvas;
			     this.params = params;
			     this.cursol = 0;
			 }();
			 timerId = setTimeout(playSpaceFilling.bind(ctx), elapse);
		     } else if (id === 'stopButton') {
			 params.cancel = true;
			 if (timerId) {

			 }
		     }
		 });
    drawSpaceFilling(dstCanvas, params);
}

function getOrderTable(level) {
    const tableWidth = Math.pow(2, level);
    const tableHeight = tableWidth;
    const tableLength = tableWidth * tableHeight;
    const orderTable = new Uint32Array(tableLength);
    // getOrderTable_Regular(orderTable);
    getOrderTable_Hilbert(orderTable, level, tableWidth);
    return orderTable;
}

function getOrderTableRev(level) {
    const orderTable = getOrderTable(level);
    const orderTableRev = new Array(orderTable.length);
    for (let i = 0, n = orderTable.length; i < n; i++) {
	const order = orderTable[i];
	if ((i !== 0) && (order === 0)) {
	    continue;
	}
	if (order in orderTableRev) {

	} else {
	    orderTableRev[order] = i;
	}
    }
    return orderTableRev;
}

function getOrderTable_Regular(orderTable) {
    for (let i = 0, n = orderTable.length; i < n; i++) {
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
    const dx = 0; const dy = 0;
    const rotFuncs = {
	0: function(x, y) { return [x, y]; },
	1: function(x, y) { return [unitWidth - 1 - y, x]; },
	2: function(x, y) { return [unitWidth - 1 - x, unitWidth - 1 - y]; },
	3: function(x, y) { return [y, unitWidth - 1 - x]; },
	4: function(x, y) { return [y, x]; },
	5: function(x, y) { return [unitWidth - 1 - x, y]; },
	6: function(x, y) { return [unitWidth - 1 - y, unitWidth - 1 - x]; },
	7: function(x, y) { return [x, unitWidth - 1 - y]; }
    };
    for (let y = 0; y < unitWidth; y++) {
	for (let x = 0; x < unitWidth; x++) {
	    const [x2, y2] = rotFuncs[orient](x, y);
	    orderTable[getOrderFromXY(dstX + x2, dstY + y2, tableWidth)] = orderTable[getOrderFromXY(x, y, tableWidth)] + plus;
	}
    }1;
}

function getOrderTable_Hilbert(orderTable, level, tableWidth) {
    const orient = 0;
    const dir = 0;
    orderTable[0] = 0;
    for (let currLevel = 1; currLevel <= level; currLevel++) {
	const unitSize = Math.pow(2, currLevel) / 2;
	const plus = unitSize * unitSize;
	if (currLevel % 2) {
	    copyWithOrient(orderTable, unitSize, 0,        tableWidth, unitSize, 4, plus);
	    copyWithOrient(orderTable, unitSize, unitSize, tableWidth, unitSize, 4, plus * 2);
	    copyWithOrient(orderTable, 0, unitSize,        tableWidth, unitSize, 2, plus * 3);
	} else {
	    copyWithOrient(orderTable, unitSize, 0,        tableWidth, unitSize, 2, plus * 3);
	    copyWithOrient(orderTable, unitSize, unitSize, tableWidth, unitSize, 4, plus * 2);
	    copyWithOrient(orderTable, 0, unitSize,        tableWidth, unitSize, 4, plus);
	}
    }
}

function getGapTable(level) {
    const width = Math.pow(2, level);
    const len = width * width * 2; // 2 = count([x.y]);
    const gapTable = new Float32Array(len);
    for (let i = 0; i < len; i++) {
	gapTable[i] = Math.random() * 5 - 2.5;
    }
    return gapTable;
}

function getOrderXY(order, level) {
    const size = Math.pow(2, level);
    const orderX = order % size;
    const orderY = (order - orderX) / size;
    return [orderX, orderY];
}

function getPosition(order, level, width, height) {
    const size = Math.pow(2, level);
    const unitX = width / size;
    const unitY = height / size;
    const [orderX, orderY] = getOrderXY(order, level);
    const x = orderX * unitX + unitX / 2;
    const y = orderY * unitY + unitY / 2;
    return [x, y];
}

function drawSpaceFilling(canvas, params) {
    const red          = 'rgb(255,  64,  64)';
    const orange       = 'rgb(255, 127,   0)';
    const yellow       = 'rgb(255, 255,   0)';
    const yellowgreen  = 'rgb(172, 255  , 0)';
    const green        = 'rgb(  0, 255, 172)';
    const blue         = 'rgb(100, 127, 255)';
    const violet       = 'rgb(200, 100, 255)';
    const colorArrArr = [
	[],
	[green],
	[red, blue],
	[red, green, blue],
	[red, yellow, green, blue],
	[red, yellow, green, blue, violet],
	[red, orange, yellow, green, blue, violet],
	[red, orange, yellow, yellowgreen, green, blue, violet]
    ];
    const widthHeight = parseFloat(document.getElementById('widthHeightRange').value);
    const level = params.level;
    const colors = params.colors;
    const orderTableRev = params.orderTableRev;
    const gapTable = params.gapTable;
    const width = widthHeight;
    const height = widthHeight;
    canvas.width = width;
    canvas.height = height;
    // console.debug("drawSpaceFilling");
    const ctx = canvas.getContext('2d');
    let [x, y] = getPosition(0, level, width, height);
    ctx.beginPath();
    ctx.strokeStyle = colorArrArr[colors][0];
    ctx.lineWidth = 1;
    ctx.arc(x, y, 3, 0, 2 * Math.PI, false); x;
    ctx.stroke();
    // console.log(orderTableRev);
    var [prevX, prevY] = [x, y];
    for (let i = 1, n = orderTableRev.length; i < n; i++) {
	const order = orderTableRev[i];
	if ((i > 0) && (!order)) {
	    continue;
	}
	ctx.beginPath();
	const colorArr = colorArrArr[colors];
	if (gapTable) {
	    ctx.moveTo(prevX + gapTable[i],
		       prevY + gapTable[n + i]);
	} else {
	    ctx.moveTo(prevX, prevY);
	}
	[x, y] = getPosition(order, level, width, height);
	// ctx.strokeStyle = colorArr[i % colorArr.length];
	const [orderX, orderY] = getOrderXY(order, level);
	if (prevX == x) {
	    ctx.strokeStyle = colorArr[orderX % colorArr.length];
	} else {
	    ctx.strokeStyle = colorArr[orderY % colorArr.length];
	}
	ctx.lineTo(x, y);
	ctx.arc(x, y, 3, 0, 2 * Math.PI, false);
	ctx.stroke();
	var [prevX, prevY] = [x, y];
    }
}

const scaleNotenameTable = {
    'C':0,
'C+':1,
'D+':1,
    'D':2,
'D+':3,
'E-':3,
    'E':4,
'F':5,
'F+':6,
'G-':6,
    'G':7,
'G+':8,
'A-':8,
    'A':9,
'A+':10,
'B':10,
'H':11
};

function getScale(order, scaleString) {
    const scaleTable = scaleString.split(/([A-H][+-]?)/).filter(function(a) { return a !== ''; });
    const scaleNum = scaleTable.length;
    let orderMod = order % scaleNum;
    if (orderMod < 0) {
	orderMod = scaleNum + orderMod;
    }
    const scaleNotename = scaleTable[orderMod];
    // 60: midi number for middle c tone
    let scale = 60 + scaleNotenameTable[scaleNotename];
    const octave = (order - (orderMod)) / scaleNum;
    scale += octave * 12;
    while (scale < 0) {
	scale += 12;
    }
    while (scale > 127) {
	scale -= 12;
    }
    return scale;
}

function drawCursolAnimation() {
    const ratio = this.ratio;
    const scaleString = this.scaleString;
    if (ratio >= 1.0) {
	const order = this.order2;
	const level = this.level;
	clearInterval(this.timerId);
	if (this.volume > 0) {
	    const size = Math.pow(2, level);
	    const [orderX, orderY] = getOrderXY(order, level);
	    const elapse = this.elapse;
	    noteOn(getScale(orderX - size / 2, scaleString), elapse / 1000, this.volume * 0.5);
	    noteOn(getScale(orderY - size / 2, scaleString), elapse / 1000, this.volume * 0.5);
	}
    }
    const canvas = this.canvas;
    const [x1, y1] = [this.x1, this.y1];
    const [x2, y2] = [this.x2, this.y2];
    const ctx = canvas.getContext('2d');
    const x = x1 * (1 - ratio) + x2 * ratio;
    const y = y1 * (1 - ratio) + y2 * ratio;
    ctx.beginPath();
    const v = Math.floor(ratio * 255);
    ctx.strokeStyle = 'rgb(' + [v, v, v].join(',') + ')';
    ctx.arc(x, y, 10 * ratio, 0, 2 * Math.PI, false);
    ctx.stroke();
    this.ratio += this.step;
}

function drawCursol(canvas, params, cursol) {
    const level = params.level;
    const orderTableRev = params.orderTableRev;
    const width = canvas.width;
    const height = canvas.height;
    const order1 = (cursol <= 0) ? orderTableRev[cursol] : orderTableRev[cursol - 1];
    const order2 = orderTableRev[cursol];
    const [x1, y1] = getPosition(order1, level, width, height);
    const [x2, y2] = getPosition(order2, level, width, height);
    const ctx = new function() {
	this.canvas = dstCanvas;
	this.x1 = x1;  this.y1 = y1;
	this.x2 = x2;  this.y2 = y2;
	this.ratio = 0;
	this.step = 0.1;
	this.order1 = order1;
	this.order2 = order2;
	this.elapse = params.elapse;
	this.level = params.level;
	this.volume = params.volume;
	this.scaleString = params.scaleString;
    }();
    const elapse = 300 * ctx.step;
    ctx.timerId = setInterval(drawCursolAnimation.bind(ctx), elapse);
}

function playSpaceFilling() {
    const canvas = this.canvas;
    const params = this.params;
    const cursol = this.cursol;
    if (params.cancel) {
	return;
    }
    const orderTableRev = params.orderTableRev;
    if (cursol <=  orderTableRev.length) {
	drawSpaceFilling(canvas, params);
	if (cursol <  orderTableRev.length) {
	    drawCursol(canvas, params, cursol);
	    this.cursol++;
	}
    }
    setTimeout(playSpaceFilling.bind(this), this.params.elapse);
}
