"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var consoleText = document.getElementById("consoleText");
function writeConsole(text) {
    consoleText.value = text + "\n" + consoleText.value;
}

function resetHTMLTable(elem) {
    while (elem.firstChild) {
	elem.removeChild(elem.firstChild);
    }
}

function omitArrayNotation(value, level) {
    if (typeof(value) === "number") {
	return Math.round(value*1000)/1000;
    }
    if ((typeof(value) !== "object") || (typeof value.length !== 'number')) {
	return value;
    }
    if (level) {
	level++;
    } else {
	level = 1;
    }
    var len = value.length;
    var value2 = [];
    var v;
    if (len > 0x10) {
	for (var i = 0 ; i < 4 ; i++) {
	    v = omitArrayNotation(value[i], level);
	    value2.push(v);
	}
	value2.push(" ... ");
	for (var i = 0 ; i < 4 ; i++) {
	    v = omitArrayNotation(value[len - 8 + i], level);
	    value2.push(v);;
	}
    } else {
	for (var i = 0 ; i < len ; i++) {
	    v = omitArrayNotation(value[i], level);
	    value2.push(v)
	}
    }
    return value2.map(function(v) {
	return (typeof(v) === "number")?
	    (Math.round(v*1000) / 1000):v;
    }).join((level<2)?", ":"_");
}

function makeHTMLTable(captionText, table, cssClass) {
    var tableElem = document.createElement("table");
    tableElem.setAttribute('class', cssClass);
    tableElem.style = "float:left;";
    var caption = document.createElement("caption");
    caption.appendChild(document.createTextNode(captionText));
    tableElem.appendChild(caption);
    var hasDetail = false;
    for (name in table) {
	hasDetail = true;
	var value = table[name];
	var tr = document.createElement("tr");
	var th = document.createElement("th");
	var td = document.createElement("td");
	th.appendChild(document.createTextNode(name));
	value = omitArrayNotation(value);
	td.appendChild(document.createTextNode(value));
	tr.appendChild(th);
	tr.appendChild(td);
	tableElem.appendChild(tr);
	tableElem.setAttribute('class', cssClass+" wordBreak");
    }
    if (hasDetail) {
	tableElem.setAttribute('class', cssClass+" wordBreak");
    }
    return tableElem;
}

function main() {
    //var imageClassList = [IO_JPEG, IO_PNG, IO_GIF, IO_TIFF, IO_BMP];
    var imageClassList = [IO_ICC, IO_JPEG, IO_PNG];
    var params = {
	'chromaticity':'ciexy',
        'tristimulus':true,
        'guide':true
    };
    var onCIEXYZdata = function(name, arr, isDefault) {
	params[name] = arr;
	if (isDefault) {
	    params['cieArr'] = arr;
	}
    }
    loadCIEXYZdata(onCIEXYZdata);
    dropFunction(document, function(buf) {
	var  iccTableContainer= document.getElementById("iccTableContainer");
	resetHTMLTable(iccTableContainer);
	var arr = new Uint8Array(buf);
	// image preview
	var previewImage = document.getElementById("previewImage");
	var blob = new Blob( [ arr ], { type: "image/*" } );
	previewImage.src = URL.createObjectURL(blob);
	// icc profile dump
	var io = null;
	for (var imgClass of imageClassList) {
	    if (imgClass.verifySig(arr)) {
		io = new imgClass();
	    }
	}
	if (! io) {
	    console.warn("Unknown image format");
	    writeConsole("Unknown image format");
	    return ;
	}
	io.parse(arr);
        var iccdata = io.getICC();
	io = null;
	if (iccdata === null) {
	    console.warn("ICC profile not found");
	    writeConsole("ICC profile not found");
	    return ;
	}
	var icc = new IO_ICC();
	if (icc.parse(iccdata) === false) {
	    console.warn("Wrong ICC profile");
	    writeConsole("Wrong ICC profile");
	    return ;
	}
	writeConsole("ICC reading Success !");
	var header = icc.getHeader();
	var tagTable = icc.getTagTable();
	console.debug(header);
	console.debug(tagTable);
	var tableElem = makeHTMLTable("Header", header, "borderRed");
	iccTableContainer.appendChild(tableElem);
	var foundTagTable = {};
	var doneFigureTable = {};
	for (var idx in tagTable) {
	    var tag = tagTable[idx];
	    var signature = tag['Signature'];
	    var type = tag['Type'];
	    var tagDetail = icc.getTagDetail(tag);
	    foundTagTable[signature] = tagDetail;
	    var captionText = signature+" (type:"+type+" size:"+tag['Size']+")";
	    var tableElem = makeHTMLTable(captionText, tagDetail, "borderGreen");
	    iccTableContainer.appendChild(tableElem);
	    function iccXYZ2yx(iccXYZ) {
		return XYZ2xy([iccXYZ['XYZ']['X'], iccXYZ['XYZ']['Y'], iccXYZ['XYZ']['Z']]);
	    }
	    if (foundTagTable['rXYZ'] && foundTagTable['gXYZ'] && foundTagTable['bXYZ']) {
		if (! doneFigureTable['CIEDiagramRGB']) {
		    doneFigureTable['CIEDiagramRGB'] = true;
		    var diagramBaseCanvas = document.createElement("canvas");
		    diagramBaseCanvas.id ="diagramBaseCanvas";
		    diagramBaseCanvas.style = "float:left;";
		    diagramBaseCanvas.setAttribute('class', "borderBlue");
		    diagramBaseCanvas.width  = 256;
		    diagramBaseCanvas.height = 256;
		    iccTableContainer.appendChild(diagramBaseCanvas);
		    params['tristimulus'] = [
			iccXYZ2yx(foundTagTable['rXYZ']),
			iccXYZ2yx(foundTagTable['gXYZ']),
			iccXYZ2yx(foundTagTable['bXYZ']) ];
		    params['caption'] = "rXYZ, gXYZ, bXYZ";
		    drawDiagramBase(diagramBaseCanvas, params, true);
		}
	    }
	    if (doneFigureTable['CIEDiagramRGB'] && foundTagTable['wtpt']) {
		if (! doneFigureTable['CIEDiagramWpt']) {
		    doneFigureTable['CIEDiagramWpt'] = true;
		}
	    }
	    if (type === "curv") {
		var curveCanvas = document.createElement("canvas");
		curveCanvas.width  = 200;
		curveCanvas.height = 200;
		curveCanvas.style = "float:left;";
		curveCanvas.setAttribute('class', "borderBlue");
		var color = "black";
		switch (signature.substr(0, 1)) {
		case 'r':
		    color = "#F66";
		    break;
		case 'g':
		    color = "#0B0";
		    break;
		case 'b':
		    color = "#66F";
		    break;
		}
		drawCurveGraph(curveCanvas, signature, tagDetail, color);
		iccTableContainer.appendChild(curveCanvas);
	    }
	    if (type === "para") {
		var curveCanvas = document.createElement("canvas");
		curveCanvas.width  = 200;
		curveCanvas.height = 200;
		curveCanvas.style = "float:left;";
		curveCanvas.setAttribute('class', "borderBlue");
		var color = "black";
		switch (signature) {
		case 'rTRC':
		case 'aarg':
		    color = "#F66";
		    break;
		case 'gTRC':
		case 'aagg':
		    color = "#0B0";
		    break;
		case 'bTRC':
		case 'aabg':
		    color = "#66F";
		    break;
		}
		drawParaCurveGraph(curveCanvas, signature, tagDetail, color);
		iccTableContainer.appendChild(curveCanvas);
	    }
	}
    }, "ArrayBuffer");
}

function drawCurveGraph(canvas, caption, data, color) {
    var ctx = canvas.getContext("2d");
    var width  = canvas.width
    var height = canvas.height;
    canvas.width  = width;
    // draw asix
    for (var i = 0 ; i <= 10 ; i++) {
	var xy = i * width / 10;
	if (i%5 === 0){
	    ctx.strokeStyle= "lightgray";
	} else {
	    ctx.strokeStyle= "gray";
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
    // draw Curve
    ctx.beginPath();
    ctx.strokeStyle= color;
    ctx.moveTo(0, height-1);
    if (data['Count'] === 1) {
	var gamma = data['Gamma'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width;
	    var yy = Math.pow(xx, gamma)
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
    } else {
	var values = data['Values'];
	for (var i = 0 , n = values.length; i < n ; i++) {
	    var xx = i / n;
	    var yy = values[i] / 0xFFFF;
	    var x = xx * width;
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(caption, width/2, 0);
    ctx.stroke();
}

function drawParaCurveGraph(canvas, caption, data, color) {
    var ctx = canvas.getContext("2d");
    var width  = canvas.width
    var height = canvas.height;
    canvas.width  = width;
    // draw asix
    for (var i = 0 ; i <= 10 ; i++) {
	var xy = i * width / 10;
	if (i%5 === 0){
	    ctx.strokeStyle= "lightgray";
	} else {
	    ctx.strokeStyle= "gray";
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
    // draw Curve
    ctx.beginPath();
    ctx.strokeStyle= color;
    ctx.moveTo(0, height-1);
    switch (data['FunctionType']) {
    case 0:
	var [g] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width;
	    var yy = Math.pow(xx, g);
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 1:
	var [g, a, b] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
	    if (xx >= (-b/a)) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = 0;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 2:
	var [g, a, b, c] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
	    if (xx >= (-b/a)) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = c;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 3:
	var [g, a, b, c, d] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
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
	var [g, a, b, c, d, e, f] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
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
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(caption, width/2, 0);
}
