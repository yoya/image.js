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
	var arr = new Uint8Array(buf);
	var bOffset = 0;
	while (true) {
	    var [bOffset, nOffset] = getImageBinaryArray(arr, bOffset);
	    // console.debug("getImageBinaryArray:", bOffset, nOffset);
	    if (bOffset === false) {
		break;
	    }
	    var blob = new Blob([arr.slice(bOffset, nOffset)]);
	    var dataURL = URL.createObjectURL(blob);
	    var Context = function() {
		this.dataURL = dataURL;
	    }
	    var ctx = new Context();
	    var id = setTimeout(addImageFile.bind(ctx), 10); // 1枚ずつ描画
	    bOffset = nOffset;
	}
    }, "ArrayBuffer");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     // drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}

function addImageFile(dataURL) {
    var dataURL = this.dataURL;
    var srcImage = new Image();
    srcImage.onload = function(e) {
	constraintImageSize(srcImage);
    }
    document.body.append(srcImage);
    srcImage.src =  dataURL;
}

function searchKey(arr, offset, keyArr) {
    var type = null;
    var keyArrLen = keyArr.length;
    for (var n = arr.length ; offset < n; offset++) {
	var bo = offset;
	for (var i = 0 ; i < keyArrLen ; i++) {
	    if (arr[offset+i] !== keyArr[i]) {
		break;
	    }
	}
	if (i === keyArrLen) {
	    return bo;
	}
    }
    return false;
}

function searchSignature(arr, offset) {
    var jpegOffset = searchKey(arr, offset, [0xFF, 0xD8]);
    var pngOffset = searchKey(arr, offset, [0x89, 0x50, 0x4E, 0x47]);
    if (jpegOffset !== false || pngOffset !== false) {
	// console.debug("jpegOffset, pngOffset:", jpegOffset, pngOffset);
	jpegOffset = (jpegOffset !== false)?jpegOffset:(-1 >>> 0);
	pngOffset = (pngOffset !== false)?pngOffset:(-1 >>> 0);
	if (jpegOffset < pngOffset) {
	    return ["jpeg", jpegOffset];
	} else {
	    return ["png", pngOffset];
	}
    }
    return [false, null];
}

function searchTailJPEG(arr, offset) {
    var endOffset = searchKey(arr, offset, [0xFF, 0xD9]);
    if (endOffset !== false) {
	return endOffset + 2; // nextOffset
    }
    return false;

}

function searchTailPNG(arr, offset) {
    var endOffset = searchKey(arr, offset, [0x49, 0x45, 0x4E, 0x44]);
    if (endOffset !== false) {
	return endOffset + 8; // nextOffset
    }
    return false;
}

function getImageBinaryArray(arr, offset)  {
    var length = arr.length;
    var [type, bOffset] = searchSignature(arr, offset);
    // console.debug("Sig:", type, bOffset);
    if (type === false) {
	return [false, false];
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
	return [false, false];
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

