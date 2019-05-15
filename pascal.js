"use strict";
/*
 * 2019/05/16- (c) yoya@awm.jp. All Rights Reserved.
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var dstCanvas = document.getElementById("dstCanvas");
    bindFunction({"widthRange":"widthText",
		  "heightRange":"heightText",
                  "nPascalRange":"nPascalText",
                  "nColorRange":"nColorText"},
		 function() {
		     drawPascalTriangle(dstCanvas);
		 } );
    drawPascalTriangle(dstCanvas);
}

function drawPascalTriangle(canvas) {
    var width = parseFloat(document.getElementById("widthRange").value);
    var height = parseFloat(document.getElementById("heightRange").value);
    var nPascal = parseFloat(document.getElementById("nPascalRange").value);
    var nColor = parseFloat(document.getElementById("nColorRange").value);
    canvas.width = width;
    canvas.height = height;
    var ctx = dstCanvas.getContext("2d");
    var unitX = width / nPascal;
    var unitY = height / nPascal;
    for (var i = 0 ; i < nPascal ; i++) {
        var y = i * unitY;
        var triangleArr = pascalTriangle(i);
        for (var j = 0 ; j < (i+1) ; j++) {
            //var x = j*unitX; // XXX
            var x = (j+(nPascal-i-1)/2)*unitX; // centering
            var value = triangleArr[j];
            // https://en.wikipedia.org/wiki/Golden_angle
            var goldenAngle = 180 * (3 - Math.sqrt(5));
            var h = goldenAngle * (value % nColor);
            h = (h % 360) | 0;
            // draw Grid Cell
            ctx.beginPath();
            ctx.strokeStyle = "hsl("+h+", 100%, 50%)";
            ctx.fillStyle = "hsla("+h+", 100%, 50%, 20%)";
            ctx.rect(x + unitX*0.1, y + unitY*0.1, unitX*0.9, unitY*0.9);
            ctx.fill()
            ctx.stroke()
            // draw Text
            ctx.beginPath();
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            var cx = x+unitX/2, cy = y+unitY/2;
            var fontSize = Math.min(unitX, unitY) / 2;
            var weight = 900;
            ctx.font = ""+weight+" "+fontSize+"px Arial";
            ctx.fillStyle = "black";
            ctx.fillText(value, cx, cy);
        }
    }
}
