"use strict";
/*
 * 2017/05/26- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    dropFunction(document, function(buf) {
	// console.debug("dropFunction");
	addImageFiles.call({buf:buf, bOffset:0});
    }, "ArrayBuffer");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     // drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}

function addImageFiles() {
    // console.debug("addImageFiles");
    var arr = new Uint8Array(this.buf);
    var bOffset = this.bOffset;
    var [bOffset, nOffset] = getImageBinaryArray(arr, bOffset);
    // console.debug("getImageBinaryArray:", bOffset, nOffset);
    if (bOffset === null) {
	return ; // finish
    }
    var blob = new Blob([arr.slice(bOffset, nOffset)]);
    var dataURL = URL.createObjectURL(blob);
    addImageFile(dataURL);
    this.bOffset = nOffset;
    setTimeout(addImageFiles.bind(this), 10); // 1枚ずつ描画
}

function addImageFile(dataURL) {
    // console.debug("addImageFile");
    var srcImage = new Image();
    srcImage.onload = function(e) {
	constraintImageSize(srcImage);
    }
    document.body.append(srcImage);
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
    if ((jpegOffset < 0) && (pngOffset < 0)) {
	return [null, null];
    }
    // console.debug("jpegOffset, pngOffset:", jpegOffset, pngOffset);
    if (jpegOffset < pngOffset) {
	return ["jpeg", jpegOffset];
    } else {
	return ["png", pngOffset];
    }
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

function getImageBinaryArray(arr, offset)  {
    var length = arr.length;
    var [type, bOffset] = searchSignature(arr, offset);
    // console.debug("Sig:", type, bOffset);
    if (type === null) {
	return [null, null];
    }
    switch (type) {
    case "jpeg":
	var nOffset = searchTailJPEG(arr, bOffset);
	break;
    case "png":
	var nOffset = searchTailPNG(arr, bOffset);
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

