"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

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
    for (name in table) {
	var value = table[name];
	var tr = document.createElement("tr");
	var th = document.createElement("th");
	var td = document.createElement("td");
	th.appendChild(document.createTextNode(name));
	if (typeof(value) === "object") {
	    value = value.toString();
	}
	td.appendChild(document.createTextNode(value));
	tr.appendChild(th);
	tr.appendChild(td);
	tableElem.appendChild(tr);
    }
}

function main() {
    var containerNode = document.getElementById("ibv_container");
    //var imageClassList = [IO_JPEG, IO_PNG, IO_GIF, IO_TIFF, IO_BMP];
    var imageClassList = [IO_ICC, IO_JPEG, IO_PNG];
    var params = {
	'chromaticity':'ciexy',
        'colorspace':'srgb',
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
	var consoleText = document.getElementById("consoleText");
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
	    consoleText.value = "Unknown image format\n"+consoleText.value;
	    return ;
	}
	io.parse(arr);
        var iccdata = io.getICC();
	io = null;
	if (iccdata === null) {
	    console.warn("ICC profile not found");
	    consoleText.value = "ICC profile not found\n"+consoleText.value;
	    return ;
	}
	var icc = new IO_ICC();
	if (icc.parse(iccdata) === false) {
	    console.warn("Wrong ICC profile");
	    consoleText.value = "Wrong ICC profile\n"+consoleText.value;
	    return ;
	}
	consoleText.value = "ICC reading Success!\n"+consoleText.value;
	var header = icc.getHeader();
	var tagTable = icc.getTagTable();
	console.debug(header);
	console.debug(tagTable);
	addHTMLTable(iccTableContainer, "Header", header, "borderRed");
	var foundTagTable = {};
	var doneFigureTable = {};
        var tristimulus = [null, null, null];
	for (var idx in tagTable) {
	    var tag = tagTable[idx];
	    var signature = tag['Signature'];
	    var type = tag['Type'];
	    foundTagTable[signature] = true;
	    var tagDetail = icc.getTagDetail(tag);
	    switch (type) {
	    case "desc":
	    case "text":
	    case "XYZ ":
		var captionText = signature+"(offset:"+tag['Offset']+" size:"+tag['Size']+")";
		addHTMLTable(iccTableContainer, captionText, tagDetail, "borderGreen");
		break;
	    }
	    function iccXYZ2yx(iccXYZ) {
		return XYZ2xy([iccXYZ['XYZ']['X'], iccXYZ['XYZ']['Y'], iccXYZ['XYZ']['Z']]);
	    }
	    if (type === "XYZ ") {
		switch (signature) {
		case 'rXYZ':
		    tristimulus[0] = iccXYZ2yx(tagDetail);
		    break;
		case 'gXYZ':
		    tristimulus[1] = iccXYZ2yx(tagDetail);
			break;
		case 'bXYZ':
		    tristimulus[2] = iccXYZ2yx(tagDetail);
		    break;
		}
	    }
	    if (foundTagTable['rXYZ'] && foundTagTable['gXYZ'] && foundTagTable['bXYZ']) {
		if (! doneFigureTable['CIEDiagramRGB']) {
		    doneFigureTable['CIEDiagramRGB'] = true;
		    var diagramBaseCanvas = document.createElement("canvas");
		    diagramBaseCanvas.id ="diagramBaseCanvas";
		    diagramBaseCanvas.setAttribute('class', "borderBlue");
		    diagramBaseCanvas.width = 256;
		    diagramBaseCanvas.height = 256;
		    iccTableContainer.appendChild(diagramBaseCanvas);
		    params['tristimulus'] = tristimulus;
		    drawDiagramBase(diagramBaseCanvas, params, true);
		}
	    }
	    if (doneFigureTable['CIEDiagramRGB'] && foundTagTable['wtpt']) {
		if (! doneFigureTable['CIEDiagramWpt']) {
		    doneFigureTable['CIEDiagramWpt'] = true;
		}
	    }
	}
    }, "ArrayBuffer");
}
