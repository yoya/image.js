'use strict';
/*
 * 2019/05/16- (c) yoya@awm.jp. All Rights Reserved.
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const dstCanvas = document.getElementById('dstCanvas');
    bindFunction({
'widthRange':'widthText',
		  'heightRange':'heightText',
                  'nPascalRange':'nPascalText',
                  'nColorRange':'nColorText',
                  'bottomBarCheckbox':null
},
		 function() {
		     drawPascalTriangle(dstCanvas);
		 });
    drawPascalTriangle(dstCanvas);
}

function drawPascalTriangle(canvas) {
    const width = parseFloat(document.getElementById('widthRange').value);
    const height = parseFloat(document.getElementById('heightRange').value);
    const nPascal = parseFloat(document.getElementById('nPascalRange').value);
    const nColor = parseFloat(document.getElementById('nColorRange').value);
    const bottomBar = document.getElementById('bottomBarCheckbox').checked;
    canvas.width = width;
    canvas.height = height;
    const ctx = dstCanvas.getContext('2d');
    const unitX = width / nPascal;
    const unitY = height / nPascal;
    for (var i = 0; i < nPascal; i++) {
        var y = i * unitY;
        var triangleArr = pascalTriangle(i);
        for (var j = 0; j < (i + 1); j++) {
            var x = (j + (nPascal - i - 1) / 2) * unitX; // centering
            var value = triangleArr[j];
            // https://en.wikipedia.org/wiki/Golden_angle
            const goldenAngle = 180 * (3 - Math.sqrt(5));
            let h = goldenAngle * (value % nColor);
            h = (h % 360) | 0;
            // draw Grid Cell
            ctx.beginPath();
            ctx.strokeStyle = 'hsl(' + h + ', 100%, 50%)';
            ctx.fillStyle = 'hsla(' + h + ', 100%, 50%, 20%)';
            ctx.rect(x + unitX * 0.1, y + unitY * 0.1, unitX * 0.9, unitY * 0.9);
            ctx.fill();
            ctx.stroke();
        }
        for (var j = 0; j < (i + 1); j++) {
            var x = (j + (nPascal - i - 1) / 2) * unitX; // centering
            var value = triangleArr[j];
            // draw Text
            ctx.beginPath();
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            var cx = x + unitX / 2; const cy = y + unitY / 2;
            const fontSize = Math.min(unitX, unitY) / 2;
            const weight = 900;
            ctx.font = '' + weight + ' ' + fontSize + 'px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(value, cx, cy);
        }
    }
    if (bottomBar) {
        var triangleArr = pascalTriangle(nPascal - 1);
        const maxValue = Math.max.apply(null, triangleArr);
        for (var i = 0; i < nPascal; i++) {
            var value = triangleArr[i];
            var cx = i * unitX + unitX / 2;
            var x = cx - unitX / 4;
            const xUnit = unitX / 2;
            var y = height * (1 - value / maxValue);
            const yUnit = height - y;
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.fillStyle = 'rgba(0, 0, 0, 20%)';
            ctx.rect(x, y, xUnit, yUnit);
            ctx.fill();
            ctx.stroke();
        }
    }
}
