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

function addHTMLTable(parentElem, captionText, table, cssClass) {
    var tableElem = document.createElement("table");
    tableElem.setAttribute('class', cssClass);
    tableElem.style = "float:left;";
    parentElem.appendChild(tableElem);
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
	if (typeof(value) === "object") {
	    if (typeof value.length === 'number') {
		var len = value.length;
		if (len > 80) {
		    var newValue = [];
		    for (var i = 0 ; i < 8 ; i++) {
			newValue.push(value[i])
		    }
		    newValue.push(" ... ");
		    for (var i = 0 ; i < 8 ; i++) {
			newValue.push(value[len - 8 + i]);;
		    }
		    value = newValue;
		}
	    }
	    value = value.toString();
	}
	td.appendChild(document.createTextNode(value));
	tr.appendChild(th);
	tr.appendChild(td);
	tableElem.appendChild(tr);
    }
    if (hasDetail) {
	tableElem.setAttribute('class', cssClass+" wordBreak");
    }
}

function main() {
    var containerNode = document.getElementById("ibv_container");
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
	addHTMLTable(iccTableContainer, "Header", header, "borderRed");
	var foundTagTable = {};
	var doneFigureTable = {};
	for (var idx in tagTable) {
	    var tag = tagTable[idx];
	    var signature = tag['Signature'];
	    var type = tag['Type'];
	    var tagDetail = icc.getTagDetail(tag);
	    foundTagTable[signature] = tagDetail;
	    var captionText = signature+" (type:"+type+" size:"+tag['Size']+")";
	    addHTMLTable(iccTableContainer, captionText, tagDetail, "borderGreen");
	    function iccXYZ2yx(iccXYZ) {
		return XYZ2xy([iccXYZ['XYZ']['X'], iccXYZ['XYZ']['Y'], iccXYZ['XYZ']['Z']]);
	    }
	    if (foundTagTable['rXYZ'] && foundTagTable['gXYZ'] && foundTagTable['bXYZ']) {
		if (! doneFigureTable['CIEDiagramRGB']) {
		    doneFigureTable['CIEDiagramRGB'] = true;
		    var diagramBaseCanvas = document.createElement("canvas");
		    diagramBaseCanvas.id ="diagramBaseCanvas";
		    diagramBaseCanvas.setAttribute('class', "borderBlue");
		    diagramBaseCanvas.width  = 256;
		    diagramBaseCanvas.height = 256;
		    iccTableContainer.appendChild(diagramBaseCanvas);
		    params['tristimulus'] = [
			    iccXYZ2yx(foundTagTable['rXYZ']),
			    iccXYZ2yx(foundTagTable['gXYZ']),
			    iccXYZ2yx(foundTagTable['bXYZ']) ];
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
		curveCanvas.setAttribute('class', "borderBlue");
		var color = "gray";
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
		drawCurveGraph(curveCanvas, tagDetail, color);
		iccTableContainer.appendChild(curveCanvas);
	    }
	}
    }, "ArrayBuffer");
}

function drawCurveGraph(canvas, data, color) {
    var ctx = canvas.getContext("2d");
    var width  = canvas.width
    var height = canvas.height;
    canvas.width  = width;
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
    ctx.stroke();
}
