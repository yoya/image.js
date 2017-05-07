"use strict";
/*
 * 2017/05/08- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    dropFunction(document, function(buf) {
	viewImageBinary(buf);
    }, "ArrayBuffer");
}

function viewImageBinary(buf) {
    var iob = new IOBin(buf);
    var signature = iob.peekString(3);
    switch (signature) {
    case "BM6": // maybe
	console.log("BMP");
	break;
    case "\xFF\xD8\xFF":
	console.log("JPEG");
	break;
    case "\x89PN":
	console.log("PNG");
	break;
    case "GIF":
	console.log("GIF");
	break;
    case "RIF": // maybe
	console.log("WebP");
	break;
    }
    
}
