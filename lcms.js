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

var elemIds = ["srcRGB",
	       "srcRRange", "srcGRange", "srcBRange",
	       "srcRText", "srcGText", "srcBText",
	       "srcCMYK",
	       "srcCRange", "srcMRange", "srcYRange", "srcKRange",
	       "srcCText", "srcMText", "srcYText", "srcKText",
	       "dstRGB",
	       "dstRRange", "dstGRange", "dstBRange",
	       "dstRText", "dstGText", "dstBText",
	       "dstCMYK",
	       "dstCRange", "dstMRange", "dstYRange", "dstKRange",
	       "dstCText", "dstMText", "dstYText", "dstKText",
	       "intentSelect" ];
var elems = {};
for (var i in elemIds) {
    var id = elemIds[i];
    elems[id] = document.getElementById(id);
}

function makeTransform(inputProfile, outputProfile) {
    var inputIsFloat  = 1; // TRUE;
    var outputIsFloat = 1; // TRUE;
    var inputFormat  = cmsFormatterForColorspaceOfProfile(inputProfile,
							  0, inputIsFloat);
    var outputFormat = cmsFormatterForColorspaceOfProfile(outputProfile,
							  0, outputIsFloat);
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

var sRGBProfile = cmsCreate_sRGBProfile();
var inputProfile  = sRGBProfile;
var outputProfile = sRGBProfile;
console.debug(inputProfile, outputProfile);
var transform = makeTransform(inputProfile, outputProfile);
console.debug("transform:"+transform);
var inputCS = cmsGetColorSpace(inputProfile);
var outputCS = cmsGetColorSpace(outputProfile);

var intent = parseFloat(elems.intentSelect.value);

elems.srcCMYK.style.display = "none";
elems.dstCMYK.style.display = "none";
console.log("transform:"+transform);

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
	if (inputProfile !== sRGBProfile) {
	    cmsCloseProfile(inputProfile);
	}
	inputProfile = h;
	console.debug("transform__:"+transform);
	cmsDeleteTransform(transform);
	transform = makeTransform(inputProfile, outputProfile);
	console.log("transform:"+transform);
	var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
	srcDesc.value = text;
	var cs = cmsGetColorSpace(h);
	inputCS = cs;
	if (cs === cmsSigRgbData) {
	    elems.srcRGB.style.display  = "block";
	    elems.srcCMYK.style.display = "none";
	    var xyY = getColorant_xyY(h);
	    if (xyY) {
		var [rxyY, gxyY, bxyY] = xyY;
		console.log(rxyY);
	    }
	} else if (cs === cmsSigCmykData) {
	    elems.srcRGB.style.display  = "none";
	    elems.srcCMYK.style.display = "block";
	    ;
	} else {
	    console.error("no supported colorspace:"+cs);
	}
	transformAndUpdate();
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
	if (outputProfile !== sRGBProfile) {
	    cmsCloseProfile(outputProfile);
	}
	outputProfile = h;
	cmsDeleteTransform(transform);
	transform = makeTransform(inputProfile, outputProfile);
	console.log("transform:"+transform);
	var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
	dstDesc.value = text;
	var cs = cmsGetColorSpace(h);
	outputCS = cs;
	if (cs === cmsSigRgbData) {
	    elems.dstRGB.style.display  = "block";
	    elems.dstCMYK.style.display = "none";
	    var xyY = getColorant_xyY(h);
	    if (xyY) {
		var [rxyY, gxyY, bxyY] = xyY;
		console.log(rxyY);
	    }
	} else if (cs === cmsSigCmykData) {
	    elems.dstRGB.style.display  = "none";
	    elems.dstCMYK.style.display = "block";
	    ;
	} else {
	    console.error("no supported colorspace:"+cs);
	}
	transformAndUpdate();
    }, "ArrayBuffer");
    var transformAndUpdate = function() {
	// transform src to dst value
	if (inputCS === cmsSigRgbData) {
	    var r = elems.srcRRange.value;
	    var g = elems.srcGRange.value;
	    var b = elems.srcBRange.value;
	    var pixel = cmsDoTransform(transform, [r/255, g/255, b/255], 1);
	} else if (outputCS === cmsSigCmykData) {
	    var cc = elems.srcCRange.value;
	    var mm = elems.srcMRange.value;
	    var yy = elems.srcYRange.value;
	    var kk = elems.srcKRange.value;
	    var pixel = cmsDoTransform(transform, [cc, mm, yy, kk], 1);
	} else {
	    console.error("no supported input colorspace:"+cs);
	}
	// update dst input value;
	if (outputCS === cmsSigRgbData) {
	    var [rr, gg, bb] = pixel;
	    elems.dstRRange.value = rr * 255;
	    elems.dstGRange.value = gg * 255;
	    elems.dstBRange.value = bb * 255;
	    elems.dstRText.value = elems.dstRRange.value;
	    elems.dstGText.value = elems.dstGRange.value;
	    elems.dstBText.value = elems.dstBRange.value;
	} else if (outputCS === cmsSigCmykData) {
	    var [cc, mm, yy, kk] = pixel;
	    elems.dstCRange.value = cc;
	    elems.dstMRange.value = mm;
	    elems.dstYRange.value = yy;
	    elems.dstKRange.value = kk;
	    elems.dstCText.value = elems.dstCRange.value;
	    elems.dstMText.value = elems.dstMRange.value;
	    elems.dstYText.value = elems.dstYRange.value;
	    elems.dstKText.value = elems.dstKRange.value;
	} else {
	    console.error("no supported output colorspace:"+cs);
	}
    }
    bindFunction({"srcRRange":"srcRText",
		  "srcGRange":"srcGText",
		  "srcBRange":"srcBText"},
		 function(target,rel) {
		     transformAndUpdate();
		 });
    bindFunction({"srcCRange":"srcCText",
		  "srcMRange":"srcMText",
		  "srcYRange":"srcYText",
		  "srcKRange":"srcKText"},
		 function(target,rel) {
		     transformAndUpdate();
		 });
    bindFunction({"intentSelect":null},
		 function(target, rel) {
		     intent = parseFloat(elems.intentSelect.value);
		     cmsDeleteTransform(transform);
		     transform = makeTransform(inputProfile, outputProfile);
		 });
}
