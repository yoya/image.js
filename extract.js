"use strict";
/*
 * 2017/05/26- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var target = document.getElementById("imageContainer");
    dropFunction(document, function(buf) {
	// console.debug("dropFunction");
	target.innerHTML = "";
	addImageFiles.call({buf:buf, bOffset:0, target:target});
    }, "ArrayBuffer");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     // drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}

var g_timeoutId = null;

function addImageFiles() {
    if (g_timeoutId !== null) {
	clearTimeout(g_timeoutId);
    }
    // console.debug("addImageFiles");
    var arr = new Uint8Array(this.buf);
    var bOffset = this.bOffset;
    var target = this.target;
    var [bOffset, nOffset] = getImageBinaryArray(arr, bOffset);
    // console.debug("getImageBinaryArray:", bOffset, nOffset);
    if (bOffset === null) {
	return ; // finish
    }
    var blob = new Blob([arr.slice(bOffset, nOffset)]);
    var dataURL = URL.createObjectURL(blob);
    addImageFile(target, dataURL);
    this.bOffset = nOffset;
    g_timeoutId = setTimeout(addImageFiles.bind(this), 0); // 1枚ずつ描画
}

function addImageFile(target, dataURL) {
    // console.debug("addImageFile");
    var srcImage = new Image();
    srcImage.onload = function(e) {
	constraintImageSize(srcImage);
    }
    target.append(srcImage);
    srcImage.src =  dataURL;
}

function searchKey(arr, offset, keyArr) {
    var keyArrLen = keyArr.length;
    for (var n = arr.length - keyArrLen - 1; offset < n; offset++) {
	offset = arr.indexOf(keyArr[0], offset);
	if (offset < 0) {
	    break;
	}
	for (var i = 1 ; i < keyArrLen ; i++) {
	    if (arr[offset+i] !== keyArr[i]) {
		break;
	    }
	}
	if (i === keyArrLen) {
	    return offset;
	}
    }
    return -1;
}

function searchSignature(arr, offset) {
    var jpegOffset = searchKey(arr, offset, [0xFF, 0xD8]);
    var pngOffset  = searchKey(arr, offset, [0x89, 0x50, 0x4E, 0x47]);
    var gifOffset  = searchKey(arr, offset, [0x47, 0x49, 0x46, 0x38]);
    if ((jpegOffset < 0) && (pngOffset < 0) && (gifOffset < 0)) {
	return [null, null];
    }
    var offsetTable = [["jpeg", jpegOffset], ["png", pngOffset], ["gif", gifOffset]];
    // console.debug(offsetTable);
    var minOffset = offsetTable.reduce(function(prev, curr) {
	if (curr[1] < 0) {
	    return prev;
	} 
	if (prev[1] < 0) {
	    return curr;
	} 
	return (prev[1] < curr[1])?prev:curr;
    });
    return minOffset;
}

function searchTailJPEG(arr, offset) {
    var endOffset = searchKey(arr, offset, [0xFF, 0xD9]);
    if (endOffset < 0) {
	return -1;
    }
    return endOffset + 2; // nextOffset
}

function searchTailPNG(arr, offset) {
    var endOffset = searchKey(arr, offset, [0x49, 0x45, 0x4E, 0x44]);
    if (endOffset < 0) {
	return -1;
    }
    return endOffset + 8; // nextOffset
}
function searchTailGIF(arr, offset) {
    offset += 10; // sig(3),ver(3),width(2),height(2)
    var flag = arr[offset++];
    offset += 2; // bgindex(1), aspect(1)
    if (flag & 0x80) { // global color table
	var nColor = Math.pow(2, (flag&0x7)+1);
	offset += 3 * nColor;
    }
    var size;
    for (var n = arr.length ; offset < n ;) {
	var sep = arr[offset++];
	switch (sep) {
	case 0x3B: // Trailer
	    return offset; // GIF Trailer Found
	    break;
	case 0x21: // Extension
	    var extLabel = arr[offset++];
	    var extSize = arr[offset++];
	    offset += extSize;
	    if (extLabel === 0xFF) {
		while (size = arr[offset++]) {
		    offset += size;
		}
	    }
	    break;
	case 0x2C: // Image
	    offset += 8; // left(2),top(2),width(2),height(2)
	    flag = arr[offset++];
	    if (flag & 0x80) { // local color table
		var nColor = Math.pow(2, (flag&0x7)+1);
		offset += 3 * nColor;
	    }
	    offset++; // lzwMinimumCodeSize
	    while (size = arr[offset++]) {
		offset += size;
	    }
	}
    }
    return -1;
}

function getImageBinaryArray(arr, offset)  {
    var length = arr.length;
    var [type, bOffset] = searchSignature(arr, offset);
    // console.debug("Sig:", type, bOffset);
    if (type === null) {
	return [null, null];
    }
    // console.debug("type, bOffset: ", type, bOffset);
    switch (type) {
    case "jpeg":
	var nOffset = searchTailJPEG(arr, bOffset);
	break;
    case "png":
	var nOffset = searchTailPNG(arr, bOffset);
	break;
    case "gif":
	var nOffset = searchTailGIF(arr, bOffset);
	break;
    }
    // console.debug("nOffset:"+nOffset);
    if (nOffset === false) {
	console.warn("type:"+type+", head only, no tail ");
	return [null, null];
    }
    return [bOffset, nOffset];
}

function constraintImageSize(image) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var width = image.width;
    var height = image.height;
    if ((maxWidthHeight < width) || (maxWidthHeight < height)) {
	if (width > height) {
	    image.width = maxWidthHeight;
	} else {
	    image.height = maxWidthHeight;
	}
    }
}

