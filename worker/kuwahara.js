"use strict";
/*
 * 2020/06/12- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    // var [variWindow, slideWindow, filterWindow] = e.data;
    var [variWindow, vslideWindow, filterWindow] =
        [e.data.variWindow, e.data.vslideWindow, e.data.filterWindow];
    var width = srcImageData.width, height = srcImageData.height;
    var variImageData = new ImageData(width, height); // variance
    var dstImageData  = new ImageData(width  - filterWindow + 1,
                                      height - filterWindow + 1);
    //
    var variTable = makeVarianceTable(srcImageData, variWindow);
    drawVarianceTable(variImageData, variTable);
    //
    for (var y = 0 ; y < (height - filterWindow + 1); y++) {
        for (var x = 0 ; x < (width - filterWindow + 1); x++) {
	    var rgba = kuwaharaFilter(srcImageData, variTable,
                                      x, y, vslideWindow, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:[variImageData, dstImageData]},
                [variImageData.data.buffer, dstImageData.data.buffer]);
}

function makeVarianceTable(srcImageData, variWindow) {
    let width = srcImageData.width, height = srcImageData.height;
    let nSamples = width * height;
    let variSamples = variWindow * variWindow;
    let varianceTable = new Float32Array(nSamples);
    let meansRGB = new Float32Array(3);
    let variRGB  = new Float32Array(3);
    for (let y = 0; y < (height - variWindow + 1); y++) {
        for (let x = 0; x < (width - variWindow + 1); x++) {
            meansRGB[0] = meansRGB[1] = meansRGB[2] = 0;
            for (let yy = 0; yy < variWindow; yy++) {
                for (let xx = 0; xx < variWindow; xx++) {
                    let rgba = getRGBA(srcImageData, x+xx, y+yy);
                    meansRGB[0] += rgba[0];
                    meansRGB[1] += rgba[1];
                    meansRGB[2] += rgba[2];
                }
            }
            meansRGB[0] /= variSamples;
            meansRGB[1] /= variSamples;
            meansRGB[2] /= variSamples;
            variRGB[0] = variRGB[1] = variRGB[2] = 0;
            for (let yy = 0; yy < variWindow; yy++) {
                for (let xx = 0; xx < variWindow; xx++) {
                    let rgba = getRGBA(srcImageData, x+xx, y+yy);
                    variRGB[0] += (rgba[0] - meansRGB[0]) ** 2;
                    variRGB[1] += (rgba[1] - meansRGB[1]) ** 2;
                    variRGB[2] += (rgba[2] - meansRGB[2]) ** 2;
                }
            }
            let i = x + y * width;
            varianceTable[i] = variRGB[0] + variRGB[1] + variRGB[2];
        }
    }
    return varianceTable;
}

function drawVarianceTable(variImageData, varianceTable) {
    let min = varianceTable.reduce((a,b) => (a<b)?a:b);
    let max = varianceTable.reduce((a,b) => (a>b)?a:b);
    let scale = 255 / (max - min);
    let data = variImageData.data;
    let n = varianceTable.length;
    let j = 0;
    for (let i = 0; i < n; i++) {
        let v = (varianceTable[i] - min) * scale;
        data[j++] = data[j++] = data[j++] = v;  data[j++] = 255;
    }
}

function kuwaharaFilter(srcImageData, varianceTable,
                        x, y, vslideWindow, filterWindow) {
    if (vslideWindow <= 0) {
        throw "vslideWindow <= 0";
    }
    let width = srcImageData.width, height = srcImageData.height;
    let candidate_xx,  candidate_yy;
    let candidate_vari = Number.MAX_VALUE;
    for (let yy = 0; yy < filterWindow; yy += vslideWindow) {
        for (let xx = 0; xx < filterWindow; xx+= vslideWindow) {
            let vari = varianceTable[(x+xx) + (y+yy) * width];
            if (vari < candidate_vari) {
                candidate_xx = xx;
                candidate_yy = yy;
                candidate_vari = vari;
            }
        }
    }
    return getRGBA(srcImageData, x + candidate_xx, y + candidate_yy);
}



