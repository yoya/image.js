'use strict';

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

const consoleText = document.getElementById('consoleText');
function writeConsole(text) {
    consoleText.value = text + '\n' + consoleText.value;
}

function resetHTMLTable(elem) {
    while (elem.firstChild) {
	elem.removeChild(elem.firstChild);
    }
}

function omitArrayNotation(value, level) {
    if (typeof (value) === 'number') {
	return Math.round(value * 1000) / 1000;
    }
    if ((typeof (value) !== 'object') || (typeof value.length !== 'number')) {
	return value;
    }
    if (level) {
	level++;
    } else {
	level = 1;
    }
    const len = value.length;
    const value2 = [];
    let v;
    if (len > 0x10) {
	for (var i = 0; i < 4; i++) {
	    v = omitArrayNotation(value[i], level);
	    value2.push(v);
	}
	value2.push(' ... ');
	for (var i = 0; i < 4; i++) {
	    v = omitArrayNotation(value[len - 8 + i], level);
	    value2.push(v);
	}
    } else {
	for (var i = 0; i < len; i++) {
	    v = omitArrayNotation(value[i], level);
	    value2.push(v);
	}
    }
    return value2.map(function(v) {
	return (typeof (v) === 'number')
	    ? (Math.round(v * 1000) / 1000) : v;
    }).join((level < 2) ? ', ' : '_');
}

function makeHTMLTable(captionText, table, cssClass) {
    const tableElem = document.createElement('table');
    tableElem.setAttribute('class', cssClass);
    tableElem.style = 'float:left;';
    const caption = document.createElement('caption');
    caption.appendChild(document.createTextNode(captionText));
    tableElem.appendChild(caption);
    let hasDetail = false;
    for (name in table) {
	hasDetail = true;
	let value = table[name];
	const tr = document.createElement('tr');
	const th = document.createElement('th');
	const td = document.createElement('td');
	th.appendChild(document.createTextNode(name));
	value = omitArrayNotation(value);
	td.appendChild(document.createTextNode(value));
	tr.appendChild(th);
	tr.appendChild(td);
	tableElem.appendChild(tr);
	tableElem.setAttribute('class', cssClass + ' wordBreak');
    }
    if (hasDetail) {
	tableElem.setAttribute('class', cssClass + ' wordBreak');
    }
    return tableElem;
}

function main() {
    // var imageClassList = [IO_JPEG, IO_PNG, IO_GIF, IO_TIFF, IO_BMP];
    const imageClassList = [IO_ICC, IO_JPEG, IO_PNG, IO_TIFF, IO_BMP, IO_GIF];
    const params = {
	'chromaticity':'ciexy',
        'tristimulus':true,
        'guide':true
    };
    const onCIEXYZdata = function(name, arr, isDefault) {
	params[name] = arr;
	if (isDefault) {
	    params.cieArr = arr;
	}
    };
    loadCIEXYZdata(onCIEXYZdata);
    dropFunction(document, function(buf) {
	const  iccTableContainer = document.getElementById('iccTableContainer');
	resetHTMLTable(iccTableContainer);
	const arr = new Uint8Array(buf);
	// image preview
	const previewImage = document.getElementById('previewImage');
	const blob = new Blob([arr], { type: 'image/*' });
	previewImage.src = URL.createObjectURL(blob);
	// icc profile dump
	let io = null;
	for (const imgClass of imageClassList) {
	    if (imgClass.verifySig(arr)) {
		io = new imgClass();
	    }
	}
	if (!io) {
	    console.warn('Unknown image format');
	    writeConsole('Unknown image format');
	    return;
	}
	io.parse(arr);
        const iccdata = io.getICC();
	io = null;
	if (iccdata === null) {
	    console.warn('ICC profile not found');
	    writeConsole('ICC profile not found');
	    return;
	}
	const icc = new IO_ICC();
	if (icc.parse(iccdata) === false) {
	    console.warn('Wrong ICC profile');
	    writeConsole('Wrong ICC profile');
	    return;
	}
	writeConsole('ICC reading Success !');
	const header = icc.getHeader();
	const tagTable = icc.getTagTable();
	console.debug(header);
	console.debug(tagTable);
	var tableElem = makeHTMLTable('Header', header, 'borderRed');
	iccTableContainer.appendChild(tableElem);
	const foundTagTable = {};
	const doneFigureTable = {};
	for (const idx in tagTable) {
	    const tag = tagTable[idx];
	    const signature = tag.Signature;
	    const type = tag.Type;
	    const tagDetail = icc.getTagDetail(tag);
	    foundTagTable[signature] = tagDetail;
	    const captionText = signature + ' (type:' + type + ' size:' + tag.Size + ')';
	    var tableElem = makeHTMLTable(captionText, tagDetail, 'borderGreen');
	    iccTableContainer.appendChild(tableElem);
	    function iccXYZ2yx(iccXYZ) {
		return XYZ2xy([iccXYZ.XYZ.X, iccXYZ.XYZ.Y, iccXYZ.XYZ.Z]);
	    }
	    if (foundTagTable.rXYZ && foundTagTable.gXYZ && foundTagTable.bXYZ && foundTagTable.wtpt) {
                const rXYZ = foundTagTable.rXYZ;
                const gXYZ = foundTagTable.gXYZ;
                const bXYZ = foundTagTable.btpt;
                const wXYZ = foundTagTable.wXYZ;
		if (!doneFigureTable.CIEDiagramRGB) {
		    doneFigureTable.CIEDiagramRGB = true;
		    const diagramBaseCanvas = document.createElement('canvas');
		    diagramBaseCanvas.id = 'diagramBaseCanvas';
		    diagramBaseCanvas.style = 'float:left;';
		    diagramBaseCanvas.setAttribute('class', 'borderBlue');
		    diagramBaseCanvas.width  = 256;
		    diagramBaseCanvas.height = 256;
		    iccTableContainer.appendChild(diagramBaseCanvas);
                    const rxy = iccXYZ2yx(foundTagTable.rXYZ);
		    const gxy = iccXYZ2yx(foundTagTable.gXYZ);
		    const bxy = iccXYZ2yx(foundTagTable.bXYZ);
                    const wxy = iccXYZ2yx(foundTagTable.wtpt);
		    params.tristimulus = [rxy, gxy, bxy];
                    params.drawPoints = [
	                { stroke:'#A00F', fill:'#F008', xy:rxy },
	                { stroke:'#0A0F', fill:'#0F08', xy:gxy },
	                { stroke:'#00AF', fill:'#00F8', xy:bxy },
	                { stroke:'#FFFF', fill:'#CCC8', xy:wxy }
                    ];
		    params.caption = 'rXYZ, gXYZ, bXYZ, wXYZ';
		    drawDiagramBase(diagramBaseCanvas, params, true);
                    drawDiagramPoints(diagramBaseCanvas, params, true);
		}
	    }
	    if ((type === 'curv') || (type === 'para')) {
		const curveCanvas = document.createElement('canvas');
		curveCanvas.width  = 200;
		curveCanvas.height = 200;
		curveCanvas.style = 'float:left;';
		curveCanvas.setAttribute('class', 'borderBlue');
		let color = 'black';
		switch (signature.substr(0, 1)) {
		case 'r':
		    color = '#F64';
		    break;
		case 'g':
		    color = '#0F0';
		    break;
		case 'b':
		    color = '#8AF';
		    break;
		}
                if (type === 'curv') {
		    drawCurveGraph(curveCanvas, signature, tagDetail, color);
                } else {
		    drawParaCurveGraph(curveCanvas, signature, tagDetail, color);
                }
		iccTableContainer.appendChild(curveCanvas);
	    }
	}
    }, 'ArrayBuffer');
}

function drawCurveGraph(canvas, caption, data, color) {
    drawCurveGraphBase(canvas, caption);
    drawCurveGraphLine(canvas, data, color);
}
function drawParaCurveGraph(canvas, caption, data, color) {
    drawParaCurveGraphBase(canvas, caption);
    drawParaCurveGraphLine(canvas, data, color);
}

function drawCurveGraphBase(canvas, caption) {
    const ctx = canvas.getContext('2d');
    const width  = canvas.width;
    const height = canvas.height;
    canvas.style.backgroundColor = '#444';
    canvas.width  = width;
    // draw asix
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
	const xy = i * width / 10;
	if (i % 5 === 0) {
	    ctx.strokeStyle = 'lightgray';
	} else {
	    ctx.strokeStyle = 'gray';
	}
	ctx.beginPath();
	ctx.moveTo(0, xy);
	ctx.lineTo(width, xy);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(xy, 0);
	ctx.lineTo(xy, height);
	ctx.stroke();
    }
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(caption, width / 2, 0);
    ctx.stroke();
}

function drawParaCurveGraphBase(canvas, caption) {
    drawCurveGraphBase(canvas, caption);
}

function drawCurveGraphLine(canvas, data, color) {
    const ctx = canvas.getContext('2d');
    const width  = canvas.width;
    const height = canvas.height;
    // draw Curve
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(0, height - 1);
    if (data.Count === 1) {
	const gamma = data.Gamma;
	for (var x = 0; x < width; x++) {
	    var xx = x / width;
	    var yy = Math.pow(xx, gamma);
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
    } else {
	const values = data.Values;
	for (let i = 0, n = values.length; i < n; i++) {
	    var xx = i / n;
	    var yy = values[i] / 0xFFFF;
	    var x = xx * width;
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
    }
    ctx.stroke();
}

function drawParaCurveGraphLine(canvas, data, color) {
    const ctx = canvas.getContext('2d');
    const width  = canvas.width;
    const height = canvas.height;

    // draw Curve
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(0, height - 1);
    switch (data.FunctionType) {
    case 0:
	var [g] = data.Values;
	for (var x = 0; x < width; x++) {
	    var xx = x / width;
	    var yy = Math.pow(xx, g);
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 1:
	var [g, a, b] = data.Values;
	for (var x = 0; x < width; x++) {
	    var xx = x / width; var yy;
	    if (xx >= (-b / a)) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = 0;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 2:
	var [g, a, b, c] = data.Values;
	for (var x = 0; x < width; x++) {
	    var xx = x / width; var yy;
	    if (xx >= (-b / a)) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = c;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 3:
	var [g, a, b, c, d] = data.Values;
	for (var x = 0; x < width; x++) {
	    var xx = x / width; var yy;
	    if (xx >= d) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = c * xx;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 4:
	var [g, a, b, c, d, e, f] = data.Values;
	for (var x = 0; x < width; x++) {
	    var xx = x / width; var yy;
	    if (xx >= d) {
		yy = Math.pow(a * xx + b, g) + c;
	    } else {
		yy = e * xx + f;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    }
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(caption, width / 2, 0);
}
