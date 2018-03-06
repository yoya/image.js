"use strict";
/*
 * 2018/03/04- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

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
    var gXYZ = cmsReadTag_XYZ(hProfile, cmsSigGreenColorantTag);
    var bXYZ = cmsReadTag_XYZ(hProfile, cmsSigBlueColorantTag);
    var rxyY = cmsXYZ2xyY(rXYZ);
    var gxyY = cmsXYZ2xyY(gXYZ);
    var bxyY = cmsXYZ2xyY(bXYZ);
    return [rxyY, gxyY, bxyY];
}

var inputProfile = cmsCreate_sRGBProfile();
var outputProfile = cmsCreate_sRGBProfile();
var transform = makeTransform(inputProfile, outputProfile);
console.log("transform:"+transform);

// c.transform = C.cmsCreateTransform(c.srcProfile, srcType, c.dstProfile, dstType, C.INTENT_PERCEPTUAL, C.cmsFLAGS_COPY_ALPHA)

function main() {
    // console.debug("main");
    var srcText = document.getElementById("srcCanvas");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcDesc = document.getElementById("srcDesc");
    var dstDesc = document.getElementById("dstDesc");
    dropFunction(srcCanvas, function(buf) {
	var arr = new Uint8Array(buf);
	var size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
	console.log("input:"+h);
	if (h) {
	    inputProfile = h;
	    transform = makeTransform(inputProfile, outputProfile);
	    console.log("transform:"+transform);
	    var text = cmsGetProfileInfoASCII(inputProfile,
					      cmsInfoDescription, "en", "US");
	    srcDesc.value = text;
	    var [rxyY, gxyY, bxyY] = getColorant_xyY(inputProfile);
	    console.log(rxyY)
	} else {
	    console.error("not ICC file");
	}
    }, "ArrayBuffer");
    dropFunction(document, function(buf) {
	var arr = new Uint8Array(buf);
	var size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
	console.log("output:"+h);
	if (h) {
	    outputProfile = h;
	    transform = makeTransform(inputProfile, outputProfile);
	    console.log("transform:"+transform);
	    var text = cmsGetProfileInfoASCII(outputProfile,
					      cmsInfoDescription, "en", "US");
	    dstDesc.value = text;
	} else {
	    console.error("not ICC file");
	}
    }, "ArrayBuffer");
}
