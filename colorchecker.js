"use strict";
/*
 * 2019/02/23- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var canvas = document.getElementById("canvas");
    var widthRange = document.getElementById("widthRange");
    var heightRange = document.getElementById("heightRange");
    var barder1Range = document.getElementById("border1Range");
    var barder2Range = document.getElementById("border2Range");
    var params = {
        width:parseFloat(widthRange.value),
        height: parseFloat(heightRange.value),
        border1:parseFloat(border1Range.value),
        border2:parseFloat(border2Range.value),
        nColumns: 6,  // horitontal
        nRows: 4,     // vertical
    };
    bindFunction({"widthRange":"widthText",
                  "heightRange":"heightText",
                  "border1Range":"border1Text",
                  "border2Range":"border2Text"},
		 function(target, rel) {
                     params['width']  = parseFloat(widthRange.value);
                     params['height'] = parseFloat(heightRange.value);
                     params['border1'] = parseFloat(border1Range.value);
                     params['border2'] = parseFloat(border2Range.value);
                     drawColorChecker(canvas, params);
		 } );
    drawColorChecker(canvas, params);
}

// https://en.wikipedia.org/wiki/ColorChecker#Colors
var checkerColors = [
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
    '#f3f3f2',  '#c8c8c8',  '#a0a0a0',  '#7a7a79',  '#555555',  '#343434',
]

function calcCellSize(params) {
    var width  = params.width;
    var height = params.height;
    var border1 = params.border1;
    var border2 = params.border2;
    var nColumns = params.nColumns;
    var nRows    = params.nRows;
    var cellWidth  = (width - 2*border1 - (nColumns-1)*border2) / nColumns;
    var cellHeight = (height - 2*border1 - (nRows-1)*border2) / nRows;
    return [cellWidth, cellHeight];
}

function drawColorChecker(canvas, params) {
    var ctx = canvas.getContext('2d');
    var width = params.width;
    var height = params.height;
    var border1 = params.border1;
    var border2 = params.border2;
    canvas.width = width;
    canvas.height = height;
    canvas.style.backgroundColor = "#000000";
    var ctx = canvas.getContext("2d");
    var [cellWidth, cellHeight] = calcCellSize(params);
    var i = 0;
    for (var yi = 0 ; yi < 4  ; yi++) {
        for (var xi = 0 ; xi < 6 ; xi++) {
            var x = border1 + xi * (cellWidth + border2);
            var y = border1 + yi * (cellHeight + border2);
            ctx.beginPath();
            ctx.fillStyle = checkerColors[i];
            ctx.rect(x, y, cellWidth, cellHeight);
            ctx.fill();
            ctx.closePath();
            i++;
        }
    }
}



