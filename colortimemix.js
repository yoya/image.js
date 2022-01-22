"use strict";
/*
 * 2022/01/22- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const canvasTable = {
        src: document.getElementById("srcCanvas"),
        red: document.getElementById("redCanvas"),
        green: document.getElementById("greenCanvas"),
        blue: document.getElementById("blueCanvas"),
        dst: document.getElementById("dstCanvas"),
    };
    const ctxTable = {
        src:canvasTable.src.getContext("2d"),
        red:canvasTable.red.getContext("2d"),
        green:canvasTable.green.getContext("2d"),
        blue:canvasTable.blue.getContext("2d"),
        dst:canvasTable.dst.getContext("2d"),
    }
    const params = {
        canvasTable: canvasTable,
        ctxTable: ctxTable,
        tick: null,
        timeoutID: null,
        delay: 100,
    };
    // console.debug(canvasTable, ctxTable);
    //
    const srcImage = new Image();
    srcImage.onload = function() {
	drawSrcImageAndCTM(srcImage, params);
    }
    srcImage.src = "./img/4x4primary-400x400.png";
    dropFunction(document, function(dataURL) {
        srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
                     drawSrcImageAndCTM(srcImage, params);
		 }, params);
    bindFunction({"buttonStart":null, "buttonStop":null,
                  "delayRange":"delayText",
                 },
		 function(target) {
                     switch (target.id) {
                     case "buttonStart":
                         stop(params);
                         start(params);
                         break;
                     case "buttonStop":
                         stop(params);
                         break;
                     case "delayRange":
                     case "delayText":
                     default:
                         break;
                     }
		 }, params);
}

function drawSrcImageAndCTM(srcImage,  params) {
    const srcCanvas = params.canvasTable.src;
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    stop(params);
    drawCTM(params);
    start(params);
}

function drawCTM(params) {
    // console.debug("drawCTM");
    const canvasTable = params.canvasTable;
    const srcCanvas = canvasTable.src;
    const redCanvas = canvasTable.red;
    const greenCanvas = canvasTable.green;
    const blueCanvas = canvasTable.blue;
    const dstCanvas = canvasTable.dst;
    const ctxTable = params.ctxTable;
    const srcCtx = ctxTable.src;
    const redCtx   = ctxTable.red;
    const greenCtx = ctxTable.green;
    const blueCtx  = ctxTable.blue;
    const dstCtx = ctxTable.dst;
    //
    const width = srcCanvas.width, height = srcCanvas.height;
    redCanvas.width = greenCanvas.width = blueCanvas.width = width;
    redCanvas.height = greenCanvas.height = blueCanvas.height = height;
    dstCanvas.width = width;  dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const srcData = srcImageData.data;
    const redImageData   = redCtx.getImageData(0, 0, width, height);
    const greenImageData = greenCtx.getImageData(0, 0, width, height);
    const blueImageData  = blueCtx.getImageData(0, 0, width, height);
    const redData = redImageData.data;
    const greenData = greenImageData.data;
    const blueData = blueImageData.data;
    for (let i = 0, n = srcData.length; i < n; i+= 4) {
        redData[i] = srcData[i];  redData[i+3] = srcData[i+3];
        greenData[i+1] = srcData[i+1];  greenData[i+3] = srcData[i+3];
        blueData[i+2] = srcData[i+2];  blueData[i+3] = srcData[i+3];
    }
    redCtx.putImageData(redImageData, 0, 0);
    greenCtx.putImageData(greenImageData, 0, 0);
    blueCtx.putImageData(blueImageData, 0, 0);
    params.imageDataTable = {
        red:redImageData, green:greenImageData, blue:blueImageData,
    }
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgba = getRGBA(srcImageData, x, y);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
}

function frame() {
    const params = this;
    const tick = params.tick;
    if (tick === null) {
        return ;
    }
    const delay = params.delayRange;
    const dstCtx = params.ctxTable.dst;
    const imageDataTable = params.imageDataTable;
    const imageData = [imageDataTable.red, imageDataTable.green, imageDataTable.blue][tick % 3];
    params.tick = tick + 1;
    dstCtx.putImageData(imageData, 0, 0);
    params.timeoutID = setTimeout(frame.bind(params), delay);
}

function start(params) {
    const delay = params.delayRange;
    params.tick = 0;
    params.timeoutID = setTimeout(frame.bind(params), delay);
}

function stop(params) {
    if (params.timeoutID) {
        clearTimeout(params.timeoutID);
    }
    params.tick = null;
}

