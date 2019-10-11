'use strict';
/*
 * 2017/06/10- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    console.debug('cie main()');
    const srcCanvas = document.getElementById('srcCanvas');
    const diagramBaseCanvas = document.getElementById('diagramBaseCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let cieSelect = document.getElementById('cieSelect').value;
    const params = {
	'chromaticity':document.getElementById('chromaticitySelect').value,
	'pointSize':parseFloat(document.getElementById('pointSizeRange').value),
        'pointDensity':parseFloat(document.getElementById('pointDensityRange').value),
	'colorspace':document.getElementById('colorspaceSelect').value,
	'tristimulus':document.getElementById('tristimulusCheckbox').checked,
	'guide':document.getElementById('guideCheckbox').checked,
        'xMin':400,
'xMax':700
    };
    const onCIEXYZdata = function(name, arr, isDefault) {
	params[name] = arr;
	if (isDefault) {
	    params.cieArr = arr;
	    drawSpectrumGraph(graphCanvas, params);
	    drawDiagram(diagramBaseCanvas, dstCanvas, params, true);
	}
    };
    bindFunction({ 'cieSelect':null },
		 function(target, rel) {
		     console.debug('cieSelect event');
		     cieSelect = document.getElementById('cieSelect').value;
		     if (cieSelect === 'ciexyz31') {
			 params.cieArr = params.cie31Arr;
		     } else if (cieSelect === 'ciexyz64') {
			 params.cieArr = params.cie64Arr;
		     } else { // "ciexyzjv"
			 params.cieArr = params.cieJVArr;
		     }
		     drawSpectrumGraph(graphCanvas, params, rel);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 });
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function(target, rel) {
		     const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     params.hist = getColorHistogram(srcCanvas);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 });
    bindFunction({
 'chromaticitySelect':null,
		  'pointSizeRange':'pointSizeText',
                  'pointDensityRange':'pointDensityText',
		  'colorspaceSelect':null,
		  'tristimulusCheckbox':null,
		  'guideCheckbox':null
		  },
		 function(target, rel) {
		     params.chromaticity = document.getElementById('chromaticitySelect').value;
		     params.pointSize = parseFloat(document.getElementById('pointSizeRange').value);
                     params.pointDensity = parseFloat(document.getElementById('pointDensityRange').value);
		     params.colorspace = document.getElementById('colorspaceSelect').value;
		     params.tristimulus = document.getElementById('tristimulusCheckbox').checked;
		     params.guide = document.getElementById('guideCheckbox').checked;
		     drawSpectrumGraph(graphCanvas, params, rel);
		     drawDiagram(diagramBaseCanvas, dstCanvas, params, rel);
		 });
    //
    dropFunction(document, function(dataURL) {
	console.debug('file drop');
	srcImage = new Image();
	srcImage.onload = function() {
	    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    params.hist = getColorHistogram(srcCanvas);
	    drawDiagram(diagramBaseCanvas, dstCanvas, params, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    loadCIEXYZdata(onCIEXYZdata);
}

const worker = new workerProcess('worker/cie.js');

function drawDiagram(diagramBaseCanvas, dstCanvas, params, sync) {
    const hist = params.hist;
    drawDiagramBase(diagramBaseCanvas, params);
    if (hist === null) {
	copyCanvas(diagramBaseCanvas, dstCanvas);
    } else {
	const diagramBaseCtx = diagramBaseCanvas.getContext('2d');
	const diagramBaseImageData = diagramBaseCtx.getImageData(0, 0, diagramBaseCanvas.width, diagramBaseCanvas.height);
	params.diagramBaseImageData = diagramBaseImageData;
	worker.process(srcCanvas, dstCanvas, params, sync);
    }
}
