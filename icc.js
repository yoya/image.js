"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function addHTMLTable(elem, table) {
    while (elem.firstChild) {
	elem.removeChild(elem.firstChild);
    }

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
	elem.appendChild(tr);
    }
}

function main() {
    var containerNode = document.getElementById("ibv_container");
    //var imageClassList = [IO_JPEG, IO_PNG, IO_GIF, IO_TIFF, IO_BMP];
    var imageClassList = [IO_JPEG, IO_PNG];
    dropFunction(document, function(buf) {
	var consoleText = document.getElementById("consoleText");
	consoleText.value = "----";
	var arr = new Uint8Array(buf);
	var io = null;
	for (var imgClass of imageClassList) {
	    if (imgClass.verifySig(arr)) {
		io = new imgClass();
	    }
	}
	if (! io) {
	    console.warn("unknown image format");
	    consoleText.value = "unknown image format";
	    return ;
	}
	io.parse(arr);
        var iccdata = io.getICC();
	io = null;
	if (iccdata === null) {
	    console.warn("icc profile not found");
	    consoleText.value = "icc profile not found";
	    return ;
	}
	var icc = new IO_ICC();
	if (icc.parse(iccdata) === false) {
	    console.warn("wrong icc profile");
	    consoleText.value = "wrong icc profile";
	    return ;
	}
	var header = icc.getHeader();
	var tagTable = icc.getTagTable();
	var iccHeaderTable = document.getElementById("iccHeaderTable");
	addHTMLTable(iccHeaderTable, header);
	var  iccTagTableContainer= document.getElementById("iccTagTableContainer");
	while (iccTagTableContainer.firstChild) {
	    iccTagTableContainer.removeChild(iccTagTableContainer.firstChild);
	}
	for (var idx in tagTable) {
	    var tag = tagTable[idx];
	    var tagDetail = icc.getTagDetail(tag);
	    switch (tag["Type"]) {
	    case "desc":
	    case "text":
	    case "XYZ ":
		var table = document.createElement("table");
		var caption = document.createElement("caption");
		caption.appendChild(document.createTextNode(tag['Signature']));
		table.style = "float:left;";
		iccTagTableContainer.appendChild(table);
		addHTMLTable(table, tagDetail);
		table.appendChild(caption);
		break;
	    }
	}
    }, "ArrayBuffer");
}


