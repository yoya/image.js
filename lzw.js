"use strict";

/*
  2020/02/19- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    var containerNode = document.getElementById("ibv_container");
    dropFunction(document, function(buf) {
        var arr = new Uint8Array(buf);
        let gif = new IO_GIF();
        let lzw = new IO_LZW();
	if (gif && lzw) {
	    gif.parse(arr);
	    let chunkList = gif.getChunkList();
            for (let chunk of chunkList) {
                if (chunk.name == "Image") {
	            // console.debug(chunk);
                    let bytes = chunk.bytes;
                    let width  = bytes[6]*0x100 + bytes[5];
                    let height = bytes[8]*0x100 + bytes[7];
                    let flags =  bytes[9];
                    let offset = 10;
                    if (flags & 0x80) { // local color table flgas
                        let tableSize = pow(2, (flags&0x3) + 1);
                        offset += 3 * tableSize; 
                    }
                    let lzwCodeSize = bytes[offset++];
                    let blockSize = bytes[offset++];
                    console.debug(width, height);
                    var indices = new Uint8Array(width * height);
                    while (blockSize > 0) {
                        let block = bytes.subarray(offset, offset + blockSize);
                        lzw.DGifDecompressLine(block, lzwCodeSize, indices);
                        console.log(indices);
                        //
                        offset += blockSize;
                        blockSize = bytes[offset++];
                    }
                    console.debug(lzwCodeSize);
                    
                }
            }
        }
    }, "ArrayBuffer");
}


