"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

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
	console.log(header);
	console.log(tagTable);
	var iccHeaderTable = document.getElementById("iccHeaderTable");
	for (name in header) {
	    var value = header[name];
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
	    iccHeaderTable.appendChild(tr);
	}
	var iccTagTable = document.getElementById("iccTagTable");
    }, "ArrayBuffer");
}


