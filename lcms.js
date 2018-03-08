"use strict";
/*
 * 2018/03/04- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var srcCanvas = document.getElementById("srcCanvas");
var dstCanvas = document.getElementById("dstCanvas");
var srcDesc = document.getElementById("srcDesc");
var dstDesc = document.getElementById("dstDesc");
// var canvases = [].map(id => document.getElementById(id));

var elemIds = ["srcDesc", "dstDesc",
	       "srcGray",
	       "srcVRange",
	       "srcVText",
	       "srcRGB",
	       "srcRRange", "srcGRange", "srcBRange",
	       "srcRText", "srcGText", "srcBText",
	       "srcCMYK",
	       "srcCRange", "srcMRange", "srcYRange", "srcKRange",
	       "srcCText", "srcMText", "srcYText", "srcKText",
	       "dstGray",
	       "dstVRange",
	       "dstVText",
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

var sRGBProfile = cmsCreate_sRGBProfile();
var inputProfile  = sRGBProfile;
var outputProfile = sRGBProfile;

var XYZProfile = cmsCreateXYZProfile()
var LabProfile = cmsCreateLab4Profile(0); // NULL
// console.debug("sRGBProfile, XYZProfile, LabProfile:", sRGBProfile, XYZProfile, LabProfile);

var transform = 0;
var transformInputXYZ, transformOutputXYZ;
var transformInputLab, transformOutputLab;
var inputCS = cmsGetColorSpace(inputProfile);
var outputCS = cmsGetColorSpace(outputProfile);
var intent = parseFloat(elems.intentSelect.value);
var isFloat = 1; // TRUE

makeTransform();
// console.debug("transform, transform(Input|Output)XYZ, transform(Input|Output)Lab", transform, transformInputXYZ,transformOutputXYZ, transformInputLab, transformOutputLab);

colorspaceUpdate();

function makeTransform() {
    var inputFormat  = cmsFormatterForColorspaceOfProfile(inputProfile,
							  isFloat?0:2,
							  isFloat);
    var outputFormat = cmsFormatterForColorspaceOfProfile(outputProfile,
							  isFloat?0:2,
							  isFloat);
    if (transform) {
	cmsDeleteTransform(transform);
	cmsDeleteTransform(transformInputXYZ);
	cmsDeleteTransform(transformOutputXYZ);
	cmsDeleteTransform(transformInputLab);
	cmsDeleteTransform(transformOutputLab);
    }
    transform = cmsCreateTransform(inputProfile, inputFormat,
				   outputProfile, outputFormat,
				   intent, cmsFLAGS_NOCACHE);
    console.log("inputFormat, outputFormat, transform:", inputFormat, outputFormat, transform);
    console.log(inputProfile, inputFormat, outputProfile, outputFormat, transform);
    var XYZFormat = isFloat?TYPE_XYZ_DBL:TYPE_XYZ_16;
    var labFormat = isFloat?TYPE_Lab_DBL:TYPE_Lab_16;
    transformInputXYZ = cmsCreateTransform(inputProfile, inputFormat,
					   XYZProfile, XYZFormat,
					   intent, cmsFLAGS_NOCACHE);
    transformOutputXYZ = cmsCreateTransform(outputProfile, outputFormat,
					    XYZProfile, XYZFormat,
					    intent, cmsFLAGS_NOCACHE);
    transformInputLab = cmsCreateTransform(inputProfile, inputFormat,
					   LabProfile, labFormat,
					   intent, cmsFLAGS_NOCACHE);
    transformOutputLab = cmsCreateTransform(outputProfile, outputFormat,
					    LabProfile, labFormat,
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

function colorspaceUpdate() {
    var cs;
    cs = inputCS;
    elems.srcGray.style.display = "none";
    elems.srcRGB.style.display  = "none";
    elems.srcCMYK.style.display = "none";
    if (cs === cmsSigGrayData) {
	elems.srcGray.style.display = "block";
    } else if (cs === cmsSigRgbData) {
	elems.srcRGB.style.display  = "block";
    } else if (cs === cmsSigCmykData) {
	elems.srcCMYK.style.display  = "block";
    } else {
	console.error("no supported input colorspace:"+cs);
    }
    cs = outputCS;
    elems.dstGray.style.display = "none";
    elems.dstRGB.style.display  = "none";
    elems.dstCMYK.style.display = "none";
    if (cs === cmsSigGrayData) {
	elems.dstGray.style.display = "block";
    } else if (cs === cmsSigRgbData) {
	elems.dstRGB.style.display  = "block";
    } else if (cs === cmsSigCmykData) {
	elems.dstCMYK.style.display = "block";
    } else {
	console.error("no supported output colorspace:"+cs);
    }
}

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
	makeTransform();
	console.log("transform:"+transform);
	var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
	elems.srcDesc.value = text;
	var cs = cmsGetColorSpace(h);
	inputCS = cs;
	colorspaceUpdate();
	if (cs === cmsSigGrayData) {
	    ;
	} else if (cs === cmsSigRgbData) {
	    var xyY = getColorant_xyY(h);
	    if (xyY) {
		var [rxyY, gxyY, bxyY] = xyY;
		console.log(rxyY);
	    }
	} else if (cs === cmsSigCmykData) {
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
	makeTransform();
	console.log("transform:"+transform);
	var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
	elems.dstDesc.value = text;
	var cs = cmsGetColorSpace(h);
	outputCS = cs;
	colorspaceUpdate();
	if (cs === cmsSigGrayData) {
	    ;
	} else if (cs === cmsSigRgbData) {
	    var xyY = getColorant_xyY(h);
	    if (xyY) {
		var [rxyY, gxyY, bxyY] = xyY;
		console.log(rxyY);
	    }
	} else if (cs === cmsSigCmykData) {
	    ;
	} else {
	    console.error("no supported output colorspace:"+cs);
	}
	transformAndUpdate();
    }, "ArrayBuffer");
    var transformAndUpdate = function() {
	// transform src to dst value
	if (inputCS === cmsSigGrayData) {
	    var v = elems.srcVRange.value;
	    if (isFloat) {
		v /= 255;
	    }
	    var pixel = cmsDoTransform(transform, [v], 1);
	} else if (inputCS === cmsSigRgbData) {
	    var r = elems.srcRRange.value;
	    var g = elems.srcGRange.value;
	    var b = elems.srcBRange.value;
	    if (isFloat) {
		r /= 255;
		g /= 255;
		b /= 255;
	    }
	    var pixel = cmsDoTransform(transform, [r, g, b], 1);
	} else if (outputCS === cmsSigCmykData) {
	    var cc = elems.srcCRange.value;
	    var mm = elems.srcMRange.value;
	    var yy = elems.srcYRange.value;
	    var kk = elems.srcKRange.value;
	    var pixel = cmsDoTransform(transform, [cc, mm, yy, kk], 1);
	} else {
	    console.error("no supported input colorspace:"+inputCS);
	}
	// update dst input value;
	if (outputCS === cmsSigGrayData) {
	    var [vv] = pixel;
	    if (isFloat) {
		vv *= 255;
	    }
	    elems.dstVRange.value = vv;
	    console.log(elems.dstVText, elems.dstVRange);
	    elems.dstVText.value = elems.dstVRange.value;
	} else if (outputCS === cmsSigRgbData) {
	    var [rr, gg, bb] = pixel;
	    if (isFloat) {
		rr *= 255;
		gg *= 255;
		bb *= 255;
	    }
	    elems.dstRRange.value = rr;
	    elems.dstGRange.value = gg;
	    elems.dstBRange.value = bb;
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
	    console.error("no supported output colorspace:"+outputCS);
	}
    }
    bindFunction({"srcRRange":"srcRText",
		  "srcGRange":"srcGText",
		  "srcBRange":"srcBText",
		  "srcCRange":"srcCText",
		  "srcMRange":"srcMText",
		  "srcYRange":"srcYText",
		  "srcKRange":"srcKText"},
		 function(target,rel) {
		     transformAndUpdate();
		 });
    bindFunction({"intentSelect":null},
		 function(target, rel) {
		     intent = parseFloat(elems.intentSelect.value);
		     makeTransform();
		 });
}
