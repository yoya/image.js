'use strict';
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    const colorMatrixTable = document.getElementById('colorMatrixTable');
    const categorySelect = document.getElementById('categorySelect');
    const colorSelect    = document.getElementById('colorSelect');
    let category = categorySelect.value;
    let color    = colorSelect.value;
    let colorMatrix = color2Matrix[color];
    const colorWindow = 4;
    const colorSelectOptions = [];
    // saving all color select option elems
    for (let i = 0, n = colorSelect.options.length; i < n; i++) {
        colorSelectOptions.push(colorSelect.options[i]);
    }
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    //
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
                  'amountRange':'amountText',
		  'linearCheckbox':null
},
		 function(target, rel) {
                     const identMatrix = color2Matrix.ident;
                     const amount = parseFloat(document.getElementById('amountRange').value);
                     const matrix = interpMatrix(identMatrix, colorMatrix, amount);

		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, matrix, rel);
		 });
    bindFunction({ 'categorySelect':null },
		 function() {
                     category = categorySelect.value;
                     while (colorSelect.options.length > 0) {
                         colorSelect.remove(0);
                     }
                     for (let i = 0, n = colorSelectOptions.length; i < n; i++) {
                         const option = colorSelectOptions[i];
                         if (category === 'all') {
                             colorSelect.add(option);
                         } else {
                             if (option.dataset && option.dataset.category) {
                                 if (category === option.dataset.category) {
                                     colorSelect.add(option);
                                 }
                             } else {
                                 if (category === 'etc') {
                                     colorSelect.add(option);
                                 }
                             }
                         }
                     }
		 });
    bindFunction({ 'colorSelect':null },
		 function(target, rel) {
		     color = colorSelect.value;
		     colorMatrix = color2Matrix[color];
		     // console.log(color, colorMatrix);
		     drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix, rel);
		     setTableValues('colorMatrixTable', colorMatrix);
		 });
    //
    bindTableFunction('colorMatrixTable', function(table, values, width) {
	colorMatrix = values;
	drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCanvas, colorMatrix, true);
    }, colorMatrix, colorWindow);
    // x2console.log(colorMatrixTable);
}

var color2Matrix = {
    // colorName:[
    // colorMatrix],
    'ident':[
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0],
    'red-add':[
	1, 0, 0, 0.5,
	0, 1, 0, 0,
	0, 0, 1, 0],
    'green-add':[
	1, 0, 0, 0,
	0, 1, 0, 0.5,
	0, 0, 1, 0],
    'blue-add':[
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0.5],
    'red-mul':[
	1.5, 0, 0, 0,
  	0, 1, 0, 0,
	0, 0, 1, 0],
    'green-mul':[
	1, 0, 0, 0,
	0, 1.5, 0, 0,
	0, 0, 1, 0],
    'blue-mul':[
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1.5, 0],
    'rgb2gbr':[
	0, 1, 0, 0,
	0, 0, 1, 0,
	1, 0, 0, 0],
    'rgb2brg':[
	0, 0, 1, 0,
	1, 0, 0, 0,
	0, 1, 0, 0],
    'rgb2bgr':[
	0, 0, 1, 0,
	0, 1, 0, 0,
	1, 0, 0, 0],
    'rgb2grb':[
	0, 1, 0, 0,
	1, 0, 0, 0,
	0, 0, 1, 0],
    'rgb2rbg':[
	1, 0, 0, 0,
	0, 0, 1, 0,
	0, 1, 0, 0],
    // http://www.colorjack.com/labs/colormatrix/
    'protanopia':[
        0.56667, 0.43333, 0, 0,
        0.55833, 0.44167, 0, 0,
        0, 0.24167, 0.75833, 0],
    'protanomaly':[
        0.81667, 0.18333, 0, 0,
        0.33333, 0.66667, 0, 0,
        0, 0.125, 0.875, 0],
    'deuteranopia':[
        0.625, 0.375, 0, 0,
        0.70, 0.30, 0, 0,
        0, 0.30, 0.70, 0],
    'deuteranomaly':[
        0.80, 0.20, 0, 0,
        0.25833, 0.74167, 0, 0,
        0, 0.14167, 0.85833, 0],
    'tritanopia':[
        0.95, 0.05, 0, 0,
        0, 0.43333, 0.56667, 0,
        0, 0.475, 0.525, 0],
    'tritanomaly':[
        0.96667, 0.03333, 0, 0,
        0, 0.73333, 0.26667, 0,
        0, 0.18333, 0.81667, 0],
    'achromatopsia':[
        0.299, 0.587, 0.114, 0,
        0.299, 0.587, 0.114, 0,
        0.299, 0.587, 0.114, 0],
    'achromatomaly':[
        0.618, 0.32, 0.062, 0,
        0.163, 0.775, 0.062, 0,
        0.163, 0.320, 0.516, 0],
    // http://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html#Tutorial
    'protanomaly2':[
        0.152286, 1.052583, -0.204868, 0,
        0.114503, 0.786281, 0.099216, 0,
        -0.003882, -0.048116, 1.051998, 0],
    'deuteranomaly2':[
        0.367322, 0.860646, -0.227968, 0,
        0.280085, 0.672501, 0.047413, 0,
        -0.011820, 0.042940, 0.968881, 0],
    'tritanomaly2':[
        1.255528, -0.076749, -0.178779, 0,
        -0.078411, 0.930809, 0.147602, 0,
        0.004733, 0.691367, 0.303900, 0],
    'negate':[
	-1, 0, 0, 1,
	0, -1, 0, 1,
	0, 0, -1, 1],
    'grayBT601':[
        0.299, 0.587, 0.114, 0,
        0.299, 0.587, 0.114, 0,
	0.299, 0.587, 0.114, 0],
    'grayBT709':[
        0.2126, 0.7152, 0.0722, 0,
        0.2126, 0.7152, 0.0722, 0,
        0.2126, 0.7152, 0.0722, 0],
    /*
    "sepia":[
	107/255*((255-64)/107), 64/255, 64/255, 0,
	64/255, 74/255*((255-64)/107), 64/255, 0,
	64/255, 64/255, 43/255*((255-64)/107), 0],
    */
    'sepia':[
	0.75, 0.25, 0.25, 0,
	0.25, 0.50, 0.25, 0,
	0.25, 0.25, 0.30, 0],
    'sepia2':[
	0.75, 0.20, 0.20, 0,
	0.20, 0.60, 0.20, 0,
	0.20, 0.20, 0.45, 0]
};

function drawSrcImageAndColorTransform(srcImage, srcCanvas, dstCancas, colorMatrix, rel) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const linear = document.getElementById('linearCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorTransform(srcCanvas, dstCanvas, colorMatrix, linear, rel);
}

const worker = new workerProcess('worker/colormat.js');

function drawColorTransform(srcCanvas, dstCanvas, colorMatrix, linear, sync) {
    const params = { colorMatrix:colorMatrix, linear:linear };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
