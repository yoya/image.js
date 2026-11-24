"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    var containerNode = document.getElementById("ibv_container");
    var ibviewer = new ImageBinaryViewer(containerNode, [IO_JPEG, IO_PNG, IO_GIF, IO_TIFF, IO_BMP]);
    dropFunction(document, function(buf) {
	ibviewer.reset();
	ibviewer.add(buf);
    }, "ArrayBuffer");
}


