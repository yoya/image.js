'use strict';
/*
 * 2019/02/23- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const canvas = document.getElementById('canvas');
    const widthRange = document.getElementById('widthRange');
    const heightRange = document.getElementById('heightRange');
    const barder1Range = document.getElementById('border1Range');
    const barder2Range = document.getElementById('border2Range');
    const params = {
        width:parseFloat(widthRange.value),
        height: parseFloat(heightRange.value),
        border1:parseFloat(border1Range.value),
        border2:parseFloat(border2Range.value),
        nColumns: 6,  // horitontal
        nRows: 4     // vertical
    };
    bindFunction({
'widthRange':'widthText',
                  'heightRange':'heightText',
                  'border1Range':'border1Text',
                  'border2Range':'border2Text'
},
		 function(target, rel) {
                     params.width  = parseFloat(widthRange.value);
                     params.height = parseFloat(heightRange.value);
                     params.border1 = parseFloat(border1Range.value);
                     params.border2 = parseFloat(border2Range.value);
                     drawColorChecker(canvas, params);
		 });
    drawColorChecker(canvas, params);
}

// https://en.wikipedia.org/wiki/ColorChecker#Colors
const checkerColors = [
    // Natural colors
    // Dark skin  Light skin  Blue sky  Foliage   Blue flower  Bluish green
    '#735244',  '#c29682',  '#627a9d',  '#576c43',  '#8580b1',  '#67bdaa',
    // Miscellaneous colors
    // Orange  Purplish blue  Moderate red  Purple  Yellow green  Orange yellow
    '#d67e2c',  '#505ba6',  '#c15a63',  '#5e3c6c',  '#9dbc40',  '#e0a32e',
    // Primary and secondary colors
    // Blue       Green       Red       Yellow       Magenta    Cyan
    '#383d96',  '#469449',  '#af363c',  '#e7c71f',  '#bb5695',  '#0885a1',
    // Grayscale colors
    // White    Neutral 8  Neutral 6.5  Neutral 5  Neutral 3.5  Black
    '#f3f3f2',  '#c8c8c8',  '#a0a0a0',  '#7a7a79',  '#555555',  '#343434'
];

function calcCellSize(params) {
    const width  = params.width;
    const height = params.height;
    const border1 = params.border1;
    const border2 = params.border2;
    const nColumns = params.nColumns;
    const nRows    = params.nRows;
    const cellWidth  = (width - 2 * border1 - (nColumns - 1) * border2) / nColumns;
    const cellHeight = (height - 2 * border1 - (nRows - 1) * border2) / nRows;
    return [cellWidth, cellHeight];
}

function drawColorChecker(canvas, params) {
    var ctx = canvas.getContext('2d');
    const width = params.width;
    const height = params.height;
    const border1 = params.border1;
    const border2 = params.border2;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#000000';  // black
    ctx.fillRect(0, 0, width, height);
    var ctx = canvas.getContext('2d');
    const [cellWidth, cellHeight] = calcCellSize(params);
    let i = 0;
    for (let yi = 0; yi < 4; yi++) {
        for (let xi = 0; xi < 6; xi++) {
            const x = border1 + xi * (cellWidth + border2);
            const y = border1 + yi * (cellHeight + border2);
            ctx.fillStyle = checkerColors[i];
            ctx.fillRect(x, y, cellWidth, cellHeight);
            i++;
        }
    }
}
