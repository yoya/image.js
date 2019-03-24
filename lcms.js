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
               "srcXYZ_XText", "srcXYZ_YText","srcXYZ_ZText",
               "srcxyY_xText", "srcxyY_yText",
	       "dstGray",
	       "dstVRange",
	       "dstVText",
	       "dstRGB",
	       "dstRRange", "dstGRange", "dstBRange",
	       "dstRText", "dstGText", "dstBText",
	       "dstCMYK",
	       "dstCRange", "dstMRange", "dstYRange", "dstKRange",
	       "dstCText", "dstMText", "dstYText", "dstKText",
               "dstXYZ_XText", "dstXYZ_YText","dstXYZ_ZText",
               "dstxyY_xText", "dstxyY_yText",
	       "intentSelect", "BPCCheckbox",
	       "transformForward", "transformInverse"];
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

var transform = 0;    // input => output convertion
var transformInverse; // output => input
var transformInputXYZ, transformOutputXYZ;
var transformInputLab, transformOutputLab;
var inputCS  = cmsGetColorSpace(inputProfile);
var outputCS = cmsGetColorSpace(outputProfile);

var isFloat = 1; // TRUE
var srcProfiles = {};
var dstProfiles = {};

var inverse = false; // false: src=>dst conversion, true: dst=>src

var diagramParams = {
    'chromaticity':'ciexy',
    'tristimulus':true,
    'guide':true,
    'normalize':"distance"
}

makeTransform();
updateSliderDisplay();

function makeTransform() {
    var intent = parseFloat(elems.intentSelect.value);
    var flags = cmsFLAGS_NOCACHE | cmsFLAGS_HIGHRESPRECALC;
    if (elems.BPCCheckbox.checked) {
	flags |= cmsFLAGS_BLACKPOINTCOMPENSATION;
    }
    var inputFormat  = cmsFormatterForColorspaceOfProfile(inputProfile,
							  isFloat?0:2,
							  isFloat);
    var outputFormat = cmsFormatterForColorspaceOfProfile(outputProfile,
							  isFloat?0:2,
							  isFloat);
    if (transform) {
	cmsDeleteTransform(transform);
	cmsDeleteTransform(transformInverse);
	cmsDeleteTransform(transformInputXYZ);
	cmsDeleteTransform(transformOutputXYZ);
	cmsDeleteTransform(transformInputLab);
	cmsDeleteTransform(transformOutputLab);
    }
    transform = cmsCreateTransform(inputProfile, inputFormat,
				   outputProfile, outputFormat,
				   intent, flags);
    transformInverse = cmsCreateTransform(outputProfile, outputFormat,
					  inputProfile, inputFormat,
					  intent, flags);
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

function updateSliderDisplay() {
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
    if (! diagramParams['cieArr']) {
	return ;
    }
    canvas.width = canvas.width; // clear canvas
    var params = diagramParams;
    params['caption'] = null;
    params['tristimulus'] = null;
    var vMax = isFloat?1:255;
    if (cs === cmsSigGrayData) {
	params['drawPoints'] = [];
    } else if (cs === cmsSigRgbData) {
	var rXYZ = cmsDoTransform(transformXYZ, [vMax,    0,   0], 1);
	var gXYZ = cmsDoTransform(transformXYZ, [  0,  vMax,   0], 1);
	var bXYZ = cmsDoTransform(transformXYZ, [  0,     0, vMax], 1);
	var wXYZ = cmsDoTransform(transformXYZ, [vMax, vMax, vMax], 1);
	var rxyY = cmsXYZ2xyY(rXYZ);
	var gxyY = cmsXYZ2xyY(gXYZ);
	var bxyY = cmsXYZ2xyY(bXYZ);
	var wxyY = cmsXYZ2xyY(wXYZ);
	params['tristimulus'] = [ rxyY, gxyY, bxyY ];
	params['drawPoints'] = [
	    { stroke:"#A00F", fill:"#F008", xy:rxyY },
	    { stroke:"#0A0F", fill:"#0F08", xy:gxyY },
	    { stroke:"#00AF", fill:"#00F8", xy:bxyY },
	    { stroke:"#FFFF", fill:"#CCC8", xy:wxyY },
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
	    { stroke:"#088F", fill:"#0FF8", xy:cxyY },
	    { stroke:"#00AF", fill:"#00F8", xy:bxyY },
	    { stroke:"#808F", fill:"#F0F8", xy:mxyY },
	    { stroke:"#A00F", fill:"#F008", xy:rxyY },
	    { stroke:"#880F", fill:"#FF08", xy:yxyY },
	    { stroke:"#0A0F", fill:"#0F08", xy:gxyY },
	    { stroke:"#FFFF", fill:"#CCC8", xy:wxyY },
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
	'drawPoints': [{ stroke:"#00F", fill:"#8888", xy:xyY } ]
    };
    drawDiagramPoints(canvas, params, true);
}

function updateDiagramSrcDstPoints() {
    var [srcPixel, dstPixel] = transformAndUpdate();
    copyCanvas(srcDiagramBaseCanvas, srcCanvas);
    copyCanvas(dstDiagramBaseCanvas, dstCanvas);
    updateDiagramPoints(srcCanvas, transformInputXYZ, srcPixel);
    updateDiagramPoints(dstCanvas, transformOutputXYZ, dstPixel);
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
    updateSliderDisplay();
    updateDiagramBaseCanvas(srcDiagramBaseCanvas, transformInputXYZ, inputCS);
    updateDiagramSrcDstPoints();
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
    updateSliderDisplay();
    updateDiagramBaseCanvas(dstDiagramBaseCanvas, transformOutputXYZ, outputCS);
    updateDiagramSrcDstPoints();
    return text;
}

var transformAndUpdate = function() {
    // transform src to dst value
    var srcPixel;
    var cs = (! inverse)?inputCS:outputCS;
    var srcRRange, srcGRange, srcBRange;
    var srcCRange, srcMRange, srcYRange, srcKRange;
    var srcRText, srcGText, srcBText;
    var srcCText, srcMText, srcYText, srcKText;
    var srcXYZ_XText, srcXYZ_YText, srcXYZ_ZText;
    var srcxyY_xText, srcxyY_yText;
    var dstRRange, dstGRange, dstBRange;
    var dstCRange, dstMRange, dstYRange, dstKRange;
    var dstRText, dstGText, dstBText;
    var dstCText, dstMText, dstYText, dstKText;
    var dstXYZ_XText, dstXYZ_YText, dstXYZ_ZText;
    var dstxyY_xText, dstxyY_yText;
    var srcTransformXYZ, dstTransformXYZ;
    if (! inverse) {
	srcRRange = elems.srcRRange;
	srcGRange = elems.srcGRange;
	srcBRange = elems.srcBRange;
	srcCRange = elems.srcCRange;
	srcMRange = elems.srcMRange;
	srcYRange = elems.srcYRange;
	srcKRange = elems.srcKRange;
	dstRRange = elems.dstRRange;
	dstGRange = elems.dstGRange;
	dstBRange = elems.dstBRange;
	dstCRange = elems.dstCRange;
	dstMRange = elems.dstMRange;
	dstYRange = elems.dstYRange;
	dstKRange = elems.dstKRange;
	srcRText = elems.srcRText;
	srcGText = elems.srcGText;
	srcBText = elems.srcBText;
	srcCText = elems.srcCText;
	srcMText = elems.srcMText;
	srcYText = elems.srcYText;
	srcKText = elems.srcKText;
	dstRText = elems.dstRText;
	dstGText = elems.dstGText;
	dstBText = elems.dstBText;
	dstCText = elems.dstCText;
	dstMText = elems.dstMText;
	dstYText = elems.dstYText;
	dstKText = elems.dstKText;
        srcXYZ_XText = elems.srcXYZ_XText;
        srcXYZ_YText = elems.srcXYZ_YText;
        srcXYZ_ZText = elems.srcXYZ_ZText;
        srcxyY_xText = elems.srcxyY_xText;
        srcxyY_yText = elems.srcxyY_yText;
        dstXYZ_XText = elems.dstXYZ_XText;
        dstXYZ_YText = elems.dstXYZ_YText;
        dstXYZ_ZText = elems.dstXYZ_ZText;
        dstxyY_xText = elems.dstxyY_xText;
        dstxyY_yText = elems.dstxyY_yText;
        srcTransformXYZ = transformInputXYZ;
        dstTransformXYZ = transformOutputXYZ;
    } else {
	srcRRange = elems.dstRRange;
	srcGRange = elems.dstGRange;
	srcBRange = elems.dstBRange;
	srcCRange = elems.dstCRange;
	srcMRange = elems.dstMRange;
	srcYRange = elems.dstYRange;
	srcKRange = elems.dstKRange;
	dstRRange = elems.srcRRange;
	dstGRange = elems.srcGRange;
	dstBRange = elems.srcBRange;
	dstCRange = elems.srcCRange;
	dstMRange = elems.srcMRange;
	dstYRange = elems.srcYRange;
	dstKRange = elems.srcKRange;
	srcRText = elems.dstRText;
	srcGText = elems.dstGText;
	srcBText = elems.dstBText;
	srcCText = elems.dstCText;
	srcMText = elems.dstMText;
	srcYText = elems.dstYText;
	srcKText = elems.dstKText;
	dstRText = elems.srcRText;
	dstGText = elems.srcGText;
	dstBText = elems.srcBText;
	dstCText = elems.srcCText;
	dstMText = elems.srcMText;
	dstYText = elems.srcYText;
	dstKText = elems.srcKText;
        srcXYZ_XText = elems.dstXYZ_XText;
        srcXYZ_YText = elems.dstXYZ_YText;
        srcXYZ_ZText = elems.dstXYZ_ZText;
        srcxyY_xText = elems.dstxyY_xText;
        srcxyY_yText = elems.dstxyY_yText;
        dstXYZ_XText = elems.srcXYZ_XText;
        dstXYZ_YText = elems.srcXYZ_YText;
        dstXYZ_ZText = elems.srcXYZ_ZText;
        dstxyY_xText = elems.srcxyY_xText;
        dstxyY_yText = elems.srcxyY_yText;
        srcTransformXYZ = transformOutputXYZ;
        dstTransformXYZ = transformInputXYZ;
    }

    if (cs === cmsSigGrayData) {
	var vv = srcVRange.value;
	if (isFloat) {
	    vv /= 255;
	}
	srcPixel = [v];
    } else if (cs === cmsSigRgbData) {
	var rr = srcRRange.value;
	var gg = srcGRange.value;
	var bb = srcBRange.value;
	if (isFloat) {
	    rr /= 255;
	    gg /= 255;
	    bb /= 255;
	}
	srcPixel = [rr, gg, bb];
    } else if (cs === cmsSigCmykData) {
	var cc = srcCRange.value;
	var mm = srcMRange.value;
	var yy = srcYRange.value;
	var kk = srcKRange.value;
	srcPixel = [cc, mm, yy, kk];
    } else {
	console.error("no supported input? colorspace:"+cs);
    }
    var xyz = cmsDoTransform(srcTransformXYZ, srcPixel, 1);
    var xyY = cmsXYZ2xyY(xyz);
    srcXYZ_XText.value = Utils.round(xyz[0], 0.001);
    srcXYZ_YText.value = Utils.round(xyz[1], 0.001);
    srcXYZ_ZText.value = Utils.round(xyz[2], 0.001);
    srcxyY_xText.value = Utils.round(xyY[0], 0.001);
    srcxyY_yText.value = Utils.round(xyY[1], 0.001);
    if (! inverse) {
	var dstPixel = cmsDoTransform(transform, srcPixel, 1);
    } else {
	var dstPixel = cmsDoTransform(transformInverse, srcPixel, 1);
    }
    // update dst input value;
    var cs = (! inverse)?outputCS:inputCS;
    if (cs === cmsSigGrayData) {
	var [vv] = dstPixel;
	if (isFloat) {
	    vv = Utils.round(vv * 255, 0.01);
	}
	dstVRange.value = vv;
	dstVText.value = dstVRange.value;
    } else if (cs === cmsSigRgbData) {
	var [rr, gg, bb] = dstPixel;
	if (isFloat) {
	    rr = Utils.round(rr * 255, 0.01);
	    gg = Utils.round(gg * 255, 0.01);
	    bb = Utils.round(bb * 255, 0.01);
	}
	dstRRange.value = rr;
	dstGRange.value = gg;
	dstBRange.value = bb;
	dstRText.value = rr;
	dstGText.value = gg;
	dstBText.value = bb;
    } else if (cs === cmsSigCmykData) {
	var [cc, mm, yy, kk] = dstPixel;
	cc = Utils.round(cc, 0.01);
	mm = Utils.round(mm, 0.01);
	yy = Utils.round(yy, 0.01);
	kk = Utils.round(kk, 0.01);
	dstCRange.value = cc;
	dstMRange.value = mm;
	dstYRange.value = yy;
	dstKRange.value = kk;
	dstCText.value = cc;
	dstMText.value = mm;
	dstYText.value = yy;
	dstKText.value = kk;
    } else {
	console.error("no supported output? colorspace:"+cs);
    }
    var xyz = cmsDoTransform(dstTransformXYZ, dstPixel, 1);
    var xyY = cmsXYZ2xyY(xyz);
    dstXYZ_XText.value = Utils.round(xyz[0], 0.001);
    dstXYZ_YText.value = Utils.round(xyz[1], 0.001);
    dstXYZ_ZText.value = Utils.round(xyz[2], 0.001);
    dstxyY_xText.value = Utils.round(xyY[0], 0.001);
    dstxyY_yText.value = Utils.round(xyY[1], 0.001);
    if (! inverse) {
	return [srcPixel, dstPixel];
    } else {
	return [dstPixel, srcPixel];
    }
}

function extractICCData(buf) {
    var imageClassList = [IO_JPEG, IO_PNG];
    var iccdata = null;
    var arr = new Uint8Array(buf);
    for (var i in imageClassList) {
	var imgClass = imageClassList[i];
	if (imgClass.verifySig(arr)) {
	    console.log(i);
	    var io = new imgClass();
	    io.parse(arr);
	    iccdata = io.getICC();
	    if (iccdata) {
		return iccdata.buffer;
	    }
	}
    }
    return buf;
}

function updateSelectIndex(select, value) {
    var options = select.options;
    for (var i = 0, n = options.length ; i < n ; i++) {
	var option = options[i];
	if (option.value === value) {
	    options.selectedIndex = i;
	    break;
	}
    }
}

function addSelectItem(select, value, text) {
    var option = document.createElement("option");
    option.value = value;
    option.appendChild(document.createTextNode(text?text:value));
    select.appendChild(option);
}

function main() {
    // console.debug("main");
    dropFunction(srcCanvas, function(buf) {
	buf = extractICCData(buf);
	var text = updateInputProfile(buf);
	updateDiagramSrcDstPoints();
	if (text) {
	    if (! srcProfiles[text]) {
		srcProfiles[text] = buf;
		addSelectItem(srcSelect, text, text);
	    }
	    updateSelectIndex(srcSelect, text);
	}
    }, "ArrayBuffer");
    dropFunction(document, function(buf) {
	buf = extractICCData(buf);
	var text = updateOutputProfile(buf);
	updateDiagramSrcDstPoints();
	if (text) {
	    if (! dstProfiles[text]) {
		dstProfiles[text] = buf;
		addSelectItem(dstSelect, text, text);
	    }
	    updateSelectIndex(dstSelect, text);
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
		     elems.transformForward.style.display = "block";
		     elems.transformInverse.style.display = "none";
		     inverse = false; // src => dst conversion
		     updateDiagramSrcDstPoints();
		 });
    bindFunction({"dstRRange":"dstRText",
		  "dstGRange":"dstGText",
		  "dstBRange":"dstBText",
		  "dstCRange":"dstCText",
		  "dstMRange":"dstMText",
		  "dstYRange":"dstYText",
		  "dstKRange":"dstKText"},
		 function(target,rel) {
		     elems.transformForward.style.display = "none";
		     elems.transformInverse.style.display = "block";
		     inverse = true; // dst => src conversion
		     updateDiagramSrcDstPoints();
		 });
    bindFunction({"intentSelect":null,
		  "BPCCheckbox":null},
		 function(target, rel) {
		     makeTransform();
		     updateDiagramSrcDstPoints();
		 });
    var onCIEXYZdata = function(name, arr, isDefault) {
	diagramParams[name] = arr;
	if (isDefault) {
	    diagramParams['cieArr'] = arr;
	    updateDiagramBaseCanvas(srcDiagramBaseCanvas, transformInputXYZ, inputCS);
	    updateDiagramBaseCanvas(dstDiagramBaseCanvas, transformOutputXYZ, outputCS);
	    updateDiagramSrcDstPoints();
	}
    }
    loadCIEXYZdata(onCIEXYZdata);
    //
    var options = srcSelect.options;
    var dstOptions = dstSelect.options;
    for (var i = 0, n = options.length ; i < n ; i++) {
	var option = options[i];
	var file = option.value;
	var text = option.firstChild.textContent;
	addSelectItem(dstSelect, file, text);
	var dstOption = dstOptions[i];
	if (file !== "")  {
	    var ctx = new function() {
		this.file = file;
		this.option = option;
		this.dstOption = dstOption;
	    };
	    loadICCProfile(ctx, function(ctx, buf) {
		srcProfiles[ctx.file] = buf;
		dstProfiles[ctx.file] = buf;
		ctx.option.disabled = false;
		ctx.dstOption.disabled = false;
		if (ctx.file === options[0].value) {
		    updateSelectIndex(srcSelect, ctx.file);
		    updateInputProfile(buf);
		    updateDiagramSrcDstPoints();

		}
		if (ctx.file === options[5].value) { // 5:JapanColorCoated2011
		    updateSelectIndex(dstSelect, ctx.file);
		    updateOutputProfile(buf);
		    updateDiagramSrcDstPoints();
		}
	    });
	}
    }
    bindFunction({"srcSelect":null},
		 function(target,rel) {
		     var buf = srcProfiles[target.value];
		     updateInputProfile(buf);
		     updateDiagramSrcDstPoints();
		 });
    bindFunction({"dstSelect":null},
		 function(target,rel) {
		     var buf = dstProfiles[target.value];
		     updateOutputProfile(buf);
		     updateDiagramSrcDstPoints();
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
