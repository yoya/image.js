'use strict';
/*
 * 2018/03/04- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

const srcSelect = document.getElementById('srcSelect');
const dstSelect = document.getElementById('dstSelect');
const srcDesc = document.getElementById('srcDesc');
const dstDesc = document.getElementById('dstDesc');
const srcCanvas = document.getElementById('srcCanvas');
const dstCanvas = document.getElementById('dstCanvas');
const srcDiagramBaseCanvas = document.getElementById('srcDiagramBaseCanvas');
const dstDiagramBaseCanvas = document.getElementById('dstDiagramBaseCanvas');

const elemIds = ['srcDesc', 'dstDesc',
	       'srcGray',
	       'srcVRange',
	       'srcVText',
	       'srcRGB',
	       'srcRRange', 'srcGRange', 'srcBRange',
	       'srcRText', 'srcGText', 'srcBText',
	       'srcCMYK',
	       'srcCRange', 'srcMRange', 'srcYRange', 'srcKRange',
	       'srcCText', 'srcMText', 'srcYText', 'srcKText',
               'srcXYZ_XText', 'srcXYZ_YText', 'srcXYZ_ZText',
               'srcxyY_xText', 'srcxyY_yText',
	       'dstGray',
	       'dstVRange',
	       'dstVText',
	       'dstRGB',
	       'dstRRange', 'dstGRange', 'dstBRange',
	       'dstRText', 'dstGText', 'dstBText',
	       'dstCMYK',
	       'dstCRange', 'dstMRange', 'dstYRange', 'dstKRange',
	       'dstCText', 'dstMText', 'dstYText', 'dstKText',
               'dstXYZ_XText', 'dstXYZ_YText', 'dstXYZ_ZText',
               'dstxyY_xText', 'dstxyY_yText',
	       'intentSelect', 'BPCCheckbox',
	       'transformForward', 'transformInverse'];
const elems = {};
for (const i in elemIds) {
    const id = elemIds[i];
    elems[id] = document.getElementById(id);
}

const sRGBProfile = cmsCreate_sRGBProfile();
let inputProfile  = sRGBProfile;
let outputProfile = sRGBProfile;

const XYZProfile = cmsCreateXYZProfile();
const LabProfile = cmsCreateLab4Profile(0); // NULL

let transform = 0;    // input => output convertion
let transformInverse; // output => input
let transformInputXYZ, transformOutputXYZ;
let transformInputLab, transformOutputLab;
let inputCS  = cmsGetColorSpace(inputProfile);
let outputCS = cmsGetColorSpace(outputProfile);

const isFloat = 1; // TRUE
const srcProfiles = {};
const dstProfiles = {};

let inverse = false; // false: src=>dst conversion, true: dst=>src

const diagramParams = {
    'chromaticity':'ciexy',
    'tristimulus':true,
    'guide':true,
    'normalize':'distance'
};

makeTransform();
updateSliderDisplay();

function makeTransform() {
    const intent = parseFloat(elems.intentSelect.value);
    let flags = cmsFLAGS_NOCACHE | cmsFLAGS_HIGHRESPRECALC;
    if (elems.BPCCheckbox.checked) {
	flags |= cmsFLAGS_BLACKPOINTCOMPENSATION;
    }
    const inputFormat  = cmsFormatterForColorspaceOfProfile(inputProfile,
							  isFloat ? 0 : 2,
							  isFloat);
    const outputFormat = cmsFormatterForColorspaceOfProfile(outputProfile,
							  isFloat ? 0 : 2,
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
    const XYZFormat = isFloat ? TYPE_XYZ_DBL : TYPE_XYZ_16;
    const labFormat = isFloat ? TYPE_Lab_DBL : TYPE_Lab_16;
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
    let cs;
    cs = inputCS;
    elems.srcGray.style.display = 'none';
    elems.srcRGB.style.display  = 'none';
    elems.srcCMYK.style.display = 'none';
    if (cs === cmsSigGrayData) {
	elems.srcGray.style.display = 'block';
    } else if (cs === cmsSigRgbData) {
	elems.srcRGB.style.display  = 'block';
    } else if (cs === cmsSigCmykData) {
	elems.srcCMYK.style.display  = 'block';
    } else {
	console.error('no supported input colorspace:' + cs);
    }
    cs = outputCS;
    elems.dstGray.style.display = 'none';
    elems.dstRGB.style.display  = 'none';
    elems.dstCMYK.style.display = 'none';
    if (cs === cmsSigGrayData) {
	elems.dstGray.style.display = 'block';
    } else if (cs === cmsSigRgbData) {
	elems.dstRGB.style.display  = 'block';
    } else if (cs === cmsSigCmykData) {
	elems.dstCMYK.style.display = 'block';
    } else {
	console.error('no supported output colorspace:' + cs);
    }
}

function updateDiagramBaseCanvas(canvas, transformXYZ, cs, pixel) {
    if (!diagramParams.cieArr) {
	return;
    }
    canvas.width = canvas.width; // clear canvas
    const params = diagramParams;
    params.caption = null;
    params.tristimulus = null;
    const vMax = isFloat ? 1 : 255;
    if (cs === cmsSigGrayData) {
	params.drawPoints = [];
    } else if (cs === cmsSigRgbData) {
	var rXYZ = cmsDoTransform(transformXYZ, [vMax,    0,   0], 1);
	var gXYZ = cmsDoTransform(transformXYZ, [0,  vMax,   0], 1);
	var bXYZ = cmsDoTransform(transformXYZ, [0,     0, vMax], 1);
	var wXYZ = cmsDoTransform(transformXYZ, [vMax, vMax, vMax], 1);
	var rxyY = cmsXYZ2xyY(rXYZ);
	var gxyY = cmsXYZ2xyY(gXYZ);
	var bxyY = cmsXYZ2xyY(bXYZ);
	var wxyY = cmsXYZ2xyY(wXYZ);
	params.tristimulus = [rxyY, gxyY, bxyY];
	params.drawPoints = [
	    { stroke:'#A00F', fill:'#F008', xy:rxyY },
	    { stroke:'#0A0F', fill:'#0F08', xy:gxyY },
	    { stroke:'#00AF', fill:'#00F8', xy:bxyY },
	    { stroke:'#FFFF', fill:'#CCC8', xy:wxyY }
	];
    } else if (cs === cmsSigCmykData) {
	const cXYZ = cmsDoTransform(transformXYZ, [100,   0,   0, 0], 1);
	var bXYZ = cmsDoTransform(transformXYZ, [100, 100,   0, 0], 1);
	const mXYZ = cmsDoTransform(transformXYZ, [0, 100,   0, 0], 1);
	var rXYZ = cmsDoTransform(transformXYZ, [0, 100, 100, 0], 1);
	const yXYZ = cmsDoTransform(transformXYZ, [0,   0, 100, 0], 1);
	var gXYZ = cmsDoTransform(transformXYZ, [100,   0, 100, 0], 1);
	var wXYZ = cmsDoTransform(transformXYZ, [0,   0,   0, 0], 1);
	const cxyY = cmsXYZ2xyY(cXYZ);
	var bxyY = cmsXYZ2xyY(bXYZ);
	const mxyY = cmsXYZ2xyY(mXYZ);
	var rxyY = cmsXYZ2xyY(rXYZ);
	const yxyY = cmsXYZ2xyY(yXYZ);
	var gxyY = cmsXYZ2xyY(gXYZ);
	var wxyY = cmsXYZ2xyY(wXYZ);
	params.tristimulus = [cxyY, bxyY, mxyY, rxyY, yxyY, gxyY];
	params.drawPoints = [
	    { stroke:'#088F', fill:'#0FF8', xy:cxyY },
	    { stroke:'#00AF', fill:'#00F8', xy:bxyY },
	    { stroke:'#808F', fill:'#F0F8', xy:mxyY },
	    { stroke:'#A00F', fill:'#F008', xy:rxyY },
	    { stroke:'#880F', fill:'#FF08', xy:yxyY },
	    { stroke:'#0A0F', fill:'#0F08', xy:gxyY },
	    { stroke:'#FFFF', fill:'#CCC8', xy:wxyY }
	];
    } else {
	console.error('no supported colorspace:' + cs);
    }
    drawDiagramBase(canvas, params);
    drawDiagramPoints(canvas, params);
}

function updateDiagramPoints(canvas, transformXYZ, pixel) {
    const xyz = cmsDoTransform(transformXYZ, pixel, 1);
    const xyY = cmsXYZ2xyY(xyz);
    const params = {
	'chromaticity':'ciexy',
	'drawPoints': [{ stroke:'#00F', fill:'#8888', xy:xyY }]
    };
    drawDiagramPoints(canvas, params);
}

function updateDiagramSrcDstPoints() {
    const [srcPixel, dstPixel] = transformAndUpdate();
    copyCanvas(srcDiagramBaseCanvas, srcCanvas);
    copyCanvas(dstDiagramBaseCanvas, dstCanvas);
    updateDiagramPoints(srcCanvas, transformInputXYZ, srcPixel);
    updateDiagramPoints(dstCanvas, transformOutputXYZ, dstPixel);
}

function updateInputProfile(buf) {
    if (buf) {
	const arr = new Uint8Array(buf);
	const size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
    } else {
	var h = sRGBProfile;
    }
    // console.debug("input:"+h);
    if (!h) {
	console.error('not ICC file');
	return null;
    }
    if (inputProfile !== sRGBProfile) {
	cmsCloseProfile(inputProfile);
    }
    inputProfile = h;
    makeTransform();
    const text = cmsGetProfileInfoASCII(h, cmsInfoDescription, 'en', 'US');
    elems.srcDesc.value = text;
    inputCS = cmsGetColorSpace(h);
    updateSliderDisplay();
    updateDiagramBaseCanvas(srcDiagramBaseCanvas, transformInputXYZ, inputCS);
    updateDiagramSrcDstPoints();
    return text;
}

function updateOutputProfile(buf) {
    if (buf) {
	const arr = new Uint8Array(buf);
	const size = arr.length;
	var h = cmsOpenProfileFromMem(arr, size);
    } else {
	var h = sRGBProfile;
    }
    // console.debug("output:"+h);
    if (!h) {
	console.error('not ICC file');
	return null;
    }
    if (outputProfile !== sRGBProfile) {
	cmsCloseProfile(outputProfile);
    }
    outputProfile = h;
    makeTransform();
    // console.log("transform:"+transform);
    const text = cmsGetProfileInfoASCII(h, cmsInfoDescription, 'en', 'US');
    elems.dstDesc.value = text;
    outputCS = cmsGetColorSpace(h);
    updateSliderDisplay();
    updateDiagramBaseCanvas(dstDiagramBaseCanvas, transformOutputXYZ, outputCS);
    updateDiagramSrcDstPoints();
    return text;
}

var transformAndUpdate = function() {
    // transform src to dst value
    let srcPixel;
    var cs = (!inverse) ? inputCS : outputCS;
    let srcRRange, srcGRange, srcBRange;
    let srcCRange, srcMRange, srcYRange, srcKRange;
    let srcRText, srcGText, srcBText;
    let srcCText, srcMText, srcYText, srcKText;
    let srcXYZ_XText, srcXYZ_YText, srcXYZ_ZText;
    let srcxyY_xText, srcxyY_yText;
    let dstVRange;
    let dstRRange, dstGRange, dstBRange;
    let dstCRange, dstMRange, dstYRange, dstKRange;
    let dstVText;
    let dstRText, dstGText, dstBText;
    let dstCText, dstMText, dstYText, dstKText;
    let dstXYZ_XText, dstXYZ_YText, dstXYZ_ZText;
    let dstxyY_xText, dstxyY_yText;
    let srcTransformXYZ, dstTransformXYZ;
    if (!inverse) {
        dstVRange = elems.dstVRange;
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
        dstVText = elems.dstVText;
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
        dstVRange = elems.srcVRange;
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
        dstVText = elems.srcVText;
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
	srcPixel = [vv];
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
	console.error('no supported input? colorspace:' + cs);
    }
    var xyz = cmsDoTransform(srcTransformXYZ, srcPixel, 1);
    var xyY = cmsXYZ2xyY(xyz);
    srcXYZ_XText.value = Utils.round(xyz[0], 0.001);
    srcXYZ_YText.value = Utils.round(xyz[1], 0.001);
    srcXYZ_ZText.value = Utils.round(xyz[2], 0.001);
    srcxyY_xText.value = Utils.round(xyY[0], 0.001);
    srcxyY_yText.value = Utils.round(xyY[1], 0.001);
    if (!inverse) {
	var dstPixel = cmsDoTransform(transform, srcPixel, 1);
    } else {
	var dstPixel = cmsDoTransform(transformInverse, srcPixel, 1);
    }
    // update dst input value;
    var cs = (!inverse) ? outputCS : inputCS;
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
	console.error('no supported output? colorspace:' + cs);
    }
    var xyz = cmsDoTransform(dstTransformXYZ, dstPixel, 1);
    var xyY = cmsXYZ2xyY(xyz);
    dstXYZ_XText.value = Utils.round(xyz[0], 0.001);
    dstXYZ_YText.value = Utils.round(xyz[1], 0.001);
    dstXYZ_ZText.value = Utils.round(xyz[2], 0.001);
    dstxyY_xText.value = Utils.round(xyY[0], 0.001);
    dstxyY_yText.value = Utils.round(xyY[1], 0.001);
    if (!inverse) {
	return [srcPixel, dstPixel];
    }
	return [dstPixel, srcPixel];
};

function extractICCData(buf) {
    const imageClassList = [IO_JPEG, IO_PNG];
    let iccdata = null;
    const arr = new Uint8Array(buf);
    for (const i in imageClassList) {
	const imgClass = imageClassList[i];
	if (imgClass.verifySig(arr)) {
	    console.log(i);
	    const io = new imgClass();
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
    const options = select.options;
    for (let i = 0, n = options.length; i < n; i++) {
	const option = options[i];
	if (option.value === value) {
	    options.selectedIndex = i;
	    break;
	}
    }
}

function addSelectItem(select, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.appendChild(document.createTextNode(text ? text : value));
    select.appendChild(option);
}

function main() {
    // console.debug("main");
    dropFunction(srcCanvas, function(buf) {
	buf = extractICCData(buf);
	const text = updateInputProfile(buf);
	updateDiagramSrcDstPoints();
	if (text) {
	    if (!srcProfiles[text]) {
		srcProfiles[text] = buf;
		addSelectItem(srcSelect, text, text);
	    }
	    updateSelectIndex(srcSelect, text);
	}
    }, 'ArrayBuffer');
    dropFunction(document, function(buf) {
	buf = extractICCData(buf);
	const text = updateOutputProfile(buf);
	updateDiagramSrcDstPoints();
	if (text) {
	    if (!dstProfiles[text]) {
		dstProfiles[text] = buf;
		addSelectItem(dstSelect, text, text);
	    }
	    updateSelectIndex(dstSelect, text);
	}
    }, 'ArrayBuffer');
    bindFunction({
 'srcVRange':'srcVText',
                  'srcRRange':'srcRText',
		  'srcGRange':'srcGText',
		  'srcBRange':'srcBText',
		  'srcCRange':'srcCText',
		  'srcMRange':'srcMText',
		  'srcYRange':'srcYText',
		  'srcKRange':'srcKText'
},
		 function(target, rel) {
		     elems.transformForward.style.display = 'block';
		     elems.transformInverse.style.display = 'none';
		     inverse = false; // src => dst conversion
		     updateDiagramSrcDstPoints();
		 });
    bindFunction({
'dstVRange':'dstVText',
                  'dstRRange':'dstRText',
		  'dstGRange':'dstGText',
		  'dstBRange':'dstBText',
		  'dstCRange':'dstCText',
		  'dstMRange':'dstMText',
		  'dstYRange':'dstYText',
		  'dstKRange':'dstKText'
},
		 function(target, rel) {
		     elems.transformForward.style.display = 'none';
		     elems.transformInverse.style.display = 'block';
		     inverse = true; // dst => src conversion
		     updateDiagramSrcDstPoints();
		 });
    bindFunction({
'intentSelect':null,
		  'BPCCheckbox':null
},
		 function(target, rel) {
		     makeTransform();
		     updateDiagramSrcDstPoints();
		 });
    const onCIEXYZdata = function(name, arr, isDefault) {
	diagramParams[name] = arr;
	if (isDefault) {
	    diagramParams.cieArr = arr;
	    updateDiagramBaseCanvas(srcDiagramBaseCanvas, transformInputXYZ, inputCS);
	    updateDiagramBaseCanvas(dstDiagramBaseCanvas, transformOutputXYZ, outputCS);
	    updateDiagramSrcDstPoints();
	}
    };
    loadCIEXYZdata(onCIEXYZdata);
    //
    const options = srcSelect.options;
    const dstOptions = dstSelect.options;
    for (let i = 0, n = options.length; i < n; i++) {
	var option = options[i];
	var file = option.value;
	const text = option.firstChild.textContent;
	addSelectItem(dstSelect, file, text);
	var dstOption = dstOptions[i];
	if (file !== '')  {
	    const ctx = new function() {
		this.file = file;
		this.option = option;
		this.dstOption = dstOption;
	    }();
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
    bindFunction({ 'srcSelect':null },
		 function(target, rel) {
		     const buf = srcProfiles[target.value];
		     updateInputProfile(buf);
		     updateDiagramSrcDstPoints();
		 });
    bindFunction({ 'dstSelect':null },
		 function(target, rel) {
		     const buf = dstProfiles[target.value];
		     updateOutputProfile(buf);
		     updateDiagramSrcDstPoints();
		 });
}

function loadICCProfile(ctx, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (this.readyState === 4) {
	    callback(this.ctx, this.response);
	}
    };
    xhr.ctx = ctx;
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', './icc/' + ctx.file, true); // async:true
    xhr.send(null);
    xhr = null;
}
