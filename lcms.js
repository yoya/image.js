"use strict";
/*
 * 2018/03/04- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var srcSelect = document.getElementById("srcSelect");
var dstSelect = document.getElementById("dstSelect");
var srcDesc = document.getElementById("srcDesc");
var dstDesc = document.getElementById("dstDesc");
var srcCanvas = document.getElementById("srcCanvas");
var dstCanvas = document.getElementById("dstCanvas");
var srcDiagramBaseCanvas = document.getElementById("srcDiagramBaseCanvas");
var dstDiagramBaseCanvas = document.getElementById("dstDiagramBaseCanvas");

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
	       "intentSelect", "BPCCheckbox" ];
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

var transform = 0;
var transformInputXYZ, transformOutputXYZ;
var transformInputLab, transformOutputLab;
var inputCS  = cmsGetColorSpace(inputProfile);
var outputCS = cmsGetColorSpace(outputProfile);

var isFloat = 1; // TRUE
var srcProfiles = {};
var dstProfiles = {};

var diagramParams = {
    'chromaticity':'ciexy',
    'tristimulus':true,
    'guide':true,
    'normalize':"distance"
}

makeTransform();
// console.debug("transform, transform(Input|Output)XYZ, transform(Input|Output)Lab", transform, transformInputXYZ,transformOutputXYZ, transformInputLab, transformOutputLab);

colorspaceUpdate();

function makeTransform() {
    var intent = parseFloat(elems.intentSelect.value);

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
    var flags = cmsFLAGS_NOCACHE | cmsFLAGS_HIGHRESPRECALC;
    if (elems.BPCCheckbox.checked) {
	flags |= cmsFLAGS_BLACKPOINTCOMPENSATION;
    }
    transform = cmsCreateTransform(inputProfile, inputFormat,
				   outputProfile, outputFormat,
				   intent, flags);
    // console.debug("inputFormat, outputFormat, transform:", inputFormat, outputFormat, transform);
    // console.debug(inputProfile, inputFormat, outputProfile, outputFormat, transform);
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

function updateDiagramBaseCanvas(canvas, transformXYZ, cs, pixel) {
    canvas.width = canvas.width; // clear canvas
    var params = diagramParams;
    params['caption'] = null;
    params['tristimulus'] = null;
    if (cs === cmsSigGrayData) {
	params['drawPoints'] = [];
    } else if (cs === cmsSigRgbData) {
	var rXYZ = cmsDoTransform(transformXYZ, [1, 0, 0], 1);
	var gXYZ = cmsDoTransform(transformXYZ, [0, 1, 0], 1);
	var bXYZ = cmsDoTransform(transformXYZ, [0, 0, 1], 1);
	var wXYZ = cmsDoTransform(transformXYZ, [1, 1, 1], 1);
	var rxyY = cmsXYZ2xyY(rXYZ);
	var gxyY = cmsXYZ2xyY(gXYZ);
	var bxyY = cmsXYZ2xyY(bXYZ);
	var wxyY = cmsXYZ2xyY(wXYZ);
	params['tristimulus'] = [ rxyY, gxyY, bxyY ];
	params['drawPoints'] = [
	    { stroke:"#F88", fill:"#F00", xy:rxyY },
	    { stroke:"#8F8", fill:"#0F0", xy:gxyY },
	    { stroke:"#88F", fill:"#00F", xy:bxyY },
	    { stroke:"#FFF", fill:"#CCC", xy:wxyY },
	];
    } else if (cs === cmsSigCmykData) {
	var cXYZ = cmsDoTransform(transformXYZ, [100,   0,   0, 0], 1);
	var bXYZ = cmsDoTransform(transformXYZ, [100, 100,   0, 0], 1);
	var mXYZ = cmsDoTransform(transformXYZ, [  0, 100,   0, 0], 1);
	var rXYZ = cmsDoTransform(transformXYZ, [  0, 100, 100, 0], 1);
	var yXYZ = cmsDoTransform(transformXYZ, [  0,   0, 100, 0], 1);
	var gXYZ = cmsDoTransform(transformXYZ, [100,   0, 100, 0], 1);
	var wXYZ = cmsDoTransform(transformXYZ, [  0,   0,   0, 0], 1);
	var cxyY = cmsXYZ2xyY(cXYZ);
	var bxyY = cmsXYZ2xyY(bXYZ);
	var mxyY = cmsXYZ2xyY(mXYZ);
	var rxyY = cmsXYZ2xyY(rXYZ);
	var yxyY = cmsXYZ2xyY(yXYZ);
	var gxyY = cmsXYZ2xyY(gXYZ);
	var wxyY = cmsXYZ2xyY(wXYZ);
	params['tristimulus'] = [ cxyY, bxyY, mxyY, rxyY , yxyY, gxyY ];
	params['drawPoints'] = [
	    { stroke:"#8FF", fill:"#0FF", xy:cxyY },
	    { stroke:"#88F", fill:"#00F", xy:bxyY },
	    { stroke:"#F8F", fill:"#F0F", xy:mxyY },
	    { stroke:"#F88", fill:"#F00", xy:rxyY },
	    { stroke:"#8F8", fill:"#0F0", xy:gxyY },
	    { stroke:"#FF8", fill:"#FF0", xy:yxyY },
	    { stroke:"#FFF", fill:"#CCC", xy:wxyY },
	];
    } else {
	console.error("no supported colorspace:"+cs);
    }
    drawDiagramBase(canvas, params, true);
    drawDiagramPoints(canvas, params, true);
}

function updateDiagramPoints(canvas, transformXYZ, pixel) {
    var xyz = cmsDoTransform(transformXYZ, pixel, 1);
    var xyY = cmsXYZ2xyY(xyz);
    var params = {
	'chromaticity':'ciexy',
	'drawPoints': [{ stroke:"black", fill:"gray", xy:xyY } ]
    };
    drawDiagramPoints(canvas, params, true);
}

function updateInputProfile(buf) {
    if (buf) {
	var arr = new Uint8Array(buf);
	var size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
    } else {
	var h = sRGBProfile;
    }
    // console.debug("input:"+h);
    if (! h) {
	console.error("not ICC file");
	return null;
    }
    if (inputProfile !== sRGBProfile) {
	cmsCloseProfile(inputProfile);
    }
    inputProfile = h;
    makeTransform();
    var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
    elems.srcDesc.value = text;
    inputCS = cmsGetColorSpace(h);
    colorspaceUpdate();
    updateDiagramBaseCanvas(srcDiagramBaseCanvas, transformInputXYZ, inputCS);
    copyCanvas(srcDiagramBaseCanvas, srcCanvas);
    transformAndUpdate();
    return text;
}

function updateOutputProfile(buf) {
    if (buf) {
	var arr = new Uint8Array(buf);
	var size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
    } else {
	var h = sRGBProfile;
    }
    // console.debug("output:"+h);
    if (! h) {
	console.error("not ICC file");
	return null;
    }
    if (outputProfile !== sRGBProfile) {
	cmsCloseProfile(outputProfile);
    }
    outputProfile = h;
    makeTransform();
    // console.log("transform:"+transform);
    var text = cmsGetProfileInfoASCII(h, cmsInfoDescription, "en", "US");
    elems.dstDesc.value = text;
    outputCS = cmsGetColorSpace(h);
    colorspaceUpdate();
    updateDiagramBaseCanvas(dstDiagramBaseCanvas, transformOutputXYZ, outputCS);
    copyCanvas(dstDiagramBaseCanvas, dstCanvas);
    transformAndUpdate();
    return text;
}

var transformAndUpdate = function() {
    // transform src to dst value
    var srcPixel;
    if (inputCS === cmsSigGrayData) {
	var v = elems.srcVRange.value;
	if (isFloat) {
	    v /= 255;
	}
	srcPixel = [v];
    } else if (inputCS === cmsSigRgbData) {
	var r = elems.srcRRange.value;
	var g = elems.srcGRange.value;
	var b = elems.srcBRange.value;
	if (isFloat) {
	    r /= 255;
	    g /= 255;
	    b /= 255;
	}
	srcPixel = [r, g, b];
    } else if (inputCS === cmsSigCmykData) {
	var cc = elems.srcCRange.value;
	var mm = elems.srcMRange.value;
	var yy = elems.srcYRange.value;
	var kk = elems.srcKRange.value;
	srcPixel = [cc, mm, yy, kk];
    } else {
	console.error("no supported input colorspace:"+inputCS);
    }
    var dstPixel = cmsDoTransform(transform, srcPixel, 1);
    // update dst input value;
    if (outputCS === cmsSigGrayData) {
	var [vv] = dstPixel;
	if (isFloat) {
	    vv *= 255;
	}
	elems.dstVRange.value = vv;
	// console.debug(elems.dstVText, elems.dstVRange);
	elems.dstVText.value = elems.dstVRange.value;
    } else if (outputCS === cmsSigRgbData) {
	var [rr, gg, bb] = dstPixel;
	if (isFloat) {
	    rr = Utils.round(rr * 255, 0.01);
	    gg = Utils.round(gg * 255, 0.01);
	    bb = Utils.round(bb * 255, 0.01);
	}
	elems.dstRRange.value = rr;
	elems.dstGRange.value = gg;
	elems.dstBRange.value = bb;
	elems.dstRText.value = rr;
	elems.dstGText.value = gg;
	elems.dstBText.value = bb;
    } else if (outputCS === cmsSigCmykData) {
	var [cc, mm, yy, kk] = dstPixel;
	cc = Utils.round(cc, 0.01);
	mm = Utils.round(mm, 0.01);
	yy = Utils.round(yy, 0.01);
	kk = Utils.round(kk, 0.01);
	elems.dstCRange.value = cc;
	elems.dstMRange.value = mm;
	elems.dstYRange.value = yy;
	elems.dstKRange.value = kk;
	elems.dstCText.value = cc;
	elems.dstMText.value = mm;
	elems.dstYText.value = yy;
	elems.dstKText.value = kk;
    } else {
	console.error("no supported output colorspace:"+outputCS);
    }
    return [srcPixel, dstPixel];
}

function updateDialogPoints() {
    var [srcPixel, dstPixel] = transformAndUpdate();
    copyCanvas(srcDiagramBaseCanvas, srcCanvas);
    copyCanvas(dstDiagramBaseCanvas, dstCanvas);
    updateDiagramPoints(srcCanvas, transformInputXYZ, srcPixel);
    updateDiagramPoints(dstCanvas, transformOutputXYZ, dstPixel);
}

function main() {
    // console.debug("main");
    dropFunction(srcCanvas, function(buf) {
	var text = updateInputProfile(buf);
	updateDialogPoints();
	if (text) {
	    if (! srcProfiles[text]) {
		srcProfiles[text] = buf;
		var option = document.createElement("option");
		option.value = text;
		option.appendChild(document.createTextNode(text));
		srcSelect.appendChild(option)
	    }
	    var options = srcSelect.options;
	    for (var i = 0, n = options.length ; i < n ; i++) {
		var option = options[i];
		if (option.value === text) {
		    options.selectedIndex = i;
		    break;
		}
	    }
	}
    }, "ArrayBuffer");
    dropFunction(document, function(buf) {
	var text = updateOutputProfile(buf);
	updateDialogPoints();
	if (text) {
	    if (! dstProfiles[text]) {
		dstProfiles[text] = buf;
		var option = document.createElement("option");
		option.value = text;
		option.appendChild(document.createTextNode(text));
		dstSelect.appendChild(option)
	    }
	    var options = dstSelect.options;
	    for (var i = 0, n = options.length ; i < n ; i++) {
		var option = options[i];
		if (option.value === text) {
		    options.selectedIndex = i;
		    break;
		}
	    }
	}
    }, "ArrayBuffer");
    bindFunction({"srcRRange":"srcRText",
		  "srcGRange":"srcGText",
		  "srcBRange":"srcBText",
		  "srcCRange":"srcCText",
		  "srcMRange":"srcMText",
		  "srcYRange":"srcYText",
		  "srcKRange":"srcKText"},
		 function(target,rel) {
		     updateDialogPoints();
		 });
    bindFunction({"intentSelect":null,
		  "BPCCheckbox":null},
		 function(target, rel) {
		     makeTransform();
		     updateDialogPoints();
		 });
    var onCIEXYZdata = function(name, arr, isDefault) {
	diagramParams[name] = arr;
	if (isDefault) {
	    diagramParams['cieArr'] = arr;
	    updateDiagramBaseCanvas(srcDiagramBaseCanvas, transformInputXYZ, inputCS);
	    updateDiagramBaseCanvas(dstDiagramBaseCanvas, transformOutputXYZ, outputCS);
	    updateDialogPoints();
	}
    }
    loadCIEXYZdata(onCIEXYZdata);
    //
    var options;
    options = srcSelect.options
    for (var i = 0, n = options.length ; i < n ; i++) {
	var option = options[i];
	var file = option.value;
	if (file !== "")  {
	    var ctx = new function() {
		this.file = file;
		this.option = option;
	    };
	    loadICCProfile(ctx, function(ctx, buf) {
		srcProfiles[ctx.file] = buf;
		ctx.option.disabled = false;
	    });
	}
    }
    options = dstSelect.options
    for (var i = 0, n = options.length ; i < n ; i++) {
	var option = options[i];
	var file = option.value;
	if (file !== "")  {
	    var ctx = new function() {
		this.file = file;
		this.option = option;
	    };
	    loadICCProfile(ctx, function(ctx, buf) {
		dstProfiles[ctx.file] = buf;
		ctx.option.disabled = false;
	    });
	}
    }
    bindFunction({"srcSelect":null},
		 function(target,rel) {
		     var buf = srcProfiles[target.value];
		     updateInputProfile(buf);
		 });
    bindFunction({"dstSelect":null},
		 function(target,rel) {
		     var buf = dstProfiles[target.value];
		     updateOutputProfile(buf);
		 });
}

function loadICCProfile(ctx, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (this.readyState === 4) {
	    callback(this.ctx, this.response);
	}
    }
    xhr.ctx = ctx;
    xhr.responseType = "arraybuffer";
    xhr.open("GET", "./icc/"+ctx.file, true); // async:true
    xhr.send(null);
    xhr = null;
}
