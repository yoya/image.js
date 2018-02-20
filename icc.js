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

function addHTMLTable(parentElem, captionText, table) {
    var tableElem = document.createElement("table");
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
    var imageClassList = [IO_JPEG, IO_PNG];
    dropFunction(document, function(buf) {
	var  iccTableContainer= document.getElementById("iccTableContainer");
	resetHTMLTable(iccTableContainer);
	var consoleText = document.getElementById("consoleText");
	var arr = new Uint8Array(buf);
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
	addHTMLTable(iccTableContainer, "Header", header);
	for (var idx in tagTable) {
	    var tag = tagTable[idx];
	    var tagDetail = icc.getTagDetail(tag);
	    switch (tag["Type"]) {
	    case "desc":
	    case "text":
	    case "XYZ ":
		var captionText = tag['Signature'];
		addHTMLTable(iccTableContainer, captionText, tagDetail);
		break;
	    }
	}
    }, "ArrayBuffer");
}


