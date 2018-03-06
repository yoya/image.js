"use strict";
/*
 * 2018/03/04- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var srcText = document.getElementById("srcCanvas");
var srcCanvas = document.getElementById("srcCanvas");
var dstCanvas = document.getElementById("dstCanvas");
var srcDesc = document.getElementById("srcDesc");
var dstDesc = document.getElementById("dstDesc");
// var canvases = [].map(id => document.getElementById(id));

var divIds = ["srcRGB", "srcR", "srcG", "srcB",
	      "srcCMYK", "srcC", "srcM", "srcY", "srcK",
	      "dstRGB", "dstR", "dstG", "dstB",
	      "dstCMYK", "dstC", "dstM", "dstY", "dstK"];
var divs = {};
for (var i in divIds) {
    var id = divIds[i];
    divs[id] = document.getElementById(id);
}

function s2ui8a(s) {
    var l = s.length;
    var a = new Uint8Array(l);
    for (var i = 0 ; i < l ; i++) {
	a[i] = s.charAt(i);
    }
    return a;
}

function makeTransform(inputProfile, outputProfile) {
    var inputFormat  = cmsFormatterForColorspaceOfProfile(inputProfile,
							  0, 1 /*True*/);
    var outputFormat = cmsFormatterForColorspaceOfProfile(outputProfile,
							  0, 1 /*True*/);
    var intent = 1;
    return cmsCreateTransform(inputProfile, inputFormat,
			      outputProfile, outputFormat,
			      intent, cmsFLAGS_NOCACHE);
}

function getColorant_xyY(hProfile) {
    var rXYZ = cmsReadTag_XYZ(hProfile, cmsSigRedColorantTag);
    if (! rXYZ) {
	return null;
    }
    var gXYZ = cmsReadTag_XYZ(hProfile, cmsSigGreenColorantTag);
    var bXYZ = cmsReadTag_XYZ(hProfile, cmsSigBlueColorantTag);
    var rxyY = cmsXYZ2xyY(rXYZ);
    var gxyY = cmsXYZ2xyY(gXYZ);
    var bxyY = cmsXYZ2xyY(bXYZ);
    return [rxyY, gxyY, bxyY];
}

var inputProfile  = cmsCreate_sRGBProfile();
var outputProfile = cmsCreate_sRGBProfile();
var transform = makeTransform(inputProfile, outputProfile);

divs.srcCMYK.style.display = "none";
divs.dstCMYK.style.display = "none";
console.log("transform:"+transform);

// c.transform = C.cmsCreateTransform(c.srcProfile, srcType, c.dstProfile, dstType, C.INTENT_PERCEPTUAL, C.cmsFLAGS_COPY_ALPHA)

function main() {
    console.debug("main");
    dropFunction(srcCanvas, function(buf) {
	var arr = new Uint8Array(buf);
	var size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
	console.log("input:"+h);
	if (! h) {
	    console.error("not ICC file");
	    return ;
	}
	inputProfile = h;
	transform = makeTransform(inputProfile, outputProfile);
	console.log("transform:"+transform);
	var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
	srcDesc.value = text;
	var cs = cmsGetColorSpace(h);
	if (cs === cmsSigRgbData) {
	    divs.srcRGB.style.display  = "block";
	    divs.srcCMYK.style.display = "none";
	    var xyY = getColorant_xyY(h);
	    if (xyY) {
		var [rxyY, gxyY, bxyY] = xyY;
		console.log(rxyY);
	    }
	} else if (cs === cmsSigCmykData) {
	    divs.srcRGB.style.display  = "none";
	    divs.srcCMYK.style.display = "block";
	    ;
	} else {
	    console.error("not supported colorspace:"+cs);
	}
    }, "ArrayBuffer");
    dropFunction(document, function(buf) {
	var arr = new Uint8Array(buf);
	var size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
	console.log("output:"+h);
	if (! h) {
	    console.error("not ICC file");
	    return ;
	}
	outputProfile = h;
	transform = makeTransform(inputProfile, outputProfile);
	console.log("transform:"+transform);
	var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
	dstDesc.value = text;
	var cs = cmsGetColorSpace(h);
	if (cs === cmsSigRgbData) {
	    divs.dstRGB.style.display  = "block";
	    divs.dstCMYK.style.display = "none";
	    var xyY = getColorant_xyY(h);
	    if (xyY) {
		var [rxyY, gxyY, bxyY] = xyY;
		console.log(rxyY);
	    }
	} else if (cs === cmsSigCmykData) {
	    divs.dstRGB.style.display  = "none";
	    divs.dstCMYK.style.display = "block";
	    ;
	} else {
	    console.error("not supported colorspace:"+cs);
	}
    }, "ArrayBuffer");
}
