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
	if ((typeof(value) !== "string") && (typeof(value) !== "number")) {
	    value = Object.values(value).join(", ");
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
	    console.warn("can't accept format");
	    consoleText.value = "can't accept format";
	    return ;
	}
	io.parse(arr);
        var iccdata = io.getICC();
	io = null;
	if (iccdata === null) {
	    console.warn("can't find icc");
	    consoleText.value = "can't find icc";
	    return ;
	}
	var icc = new IO_ICC();
	if (icc.parse(iccdata) === false) {
	    console.warn("icc parse error");
	    consoleText.value = "icc parse error";
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
		var table = document.createElement("table");
		table.style = "float:left;";
		iccTagTableContainer.appendChild(table);
		addHTMLTable(table, tagDetail);
		break;
	    }
	}
    }, "ArrayBuffer");
}


