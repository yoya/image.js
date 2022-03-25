"use strict";
/*
 * 2022/03/25- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const sendCanvas = document.getElementById("sendCanvas");
    const receiveCanvas = document.getElementById("receiveCanvas");
    const srcImage = new Image();
    const params = {};
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndMorse(sendCanvas, receiveCanvas, params);
		 }, params);
    drawSrcImageAndMorse(sendCanvas, receiveCanvas, params);
}

function drawSrcImageAndMorse(sendCancas, receiveCanvas, params) {
    //drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    sendCanvas.width = sendCanvas.width;  // clear
    receiveCanvas.width = receiveCanvas.width;  // clear
    drawMorseReceive(receiveCanvas);
    drawMorseSend(sendCanvas);
}

function drawCoinCircle(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.save();
    const {width, height} = canvas;
    const wc = width / 2;
    const hc = height / 2;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "#bbaa00";
    //
    const scale = 0.87;
    const scale2 = scale * 0.92;
    ctx.beginPath();
    ctx.arc(wc, hc, wc*scale, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    //
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.fillStyle = "#666600";
    ctx.arc(wc, hc, wc*scale2, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

function drawTextCenteringWithRotate(canvas, text, fontsize,xp, yp, rotate) {
    const ctx = canvas.getContext("2d");
    ctx.save();
    const {width, height} = canvas;
    ctx.strokeStyle = "#aaaa00";
    ctx.fillStyle = "#eeee00";
    ctx.font = (width*fontsize)+"px Ariel"
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const x = xp * width, y = yp * height;
    ctx.fillText(text, x, y);
    ctx.strokeText(text, x, y);
    ctx.restore();
}

function drawMorseSend(canvas) {
    const ctx = canvas.getContext("2d");
    drawCoinCircle(canvas);
    drawTextCenteringWithRotate(canvas, "SEND SIDE", 0.06, 0.5, 0.2, 0);
}

const sendCharTable = [
    [0.19, 0.3, 'H', 0.03, -0.04],
];

function drawPointAndCharactor(canvas, a) {
    const ctx = canvas.getContext("2d");
    const {width, height} = canvas;
    const [x1, y1, c, x2, y2] = a;
    ctx.fillStyle = "#eeee00";
    ctx.beginPath();
    ctx.arc(x1*width, y1*height, width*0.01, 0, 2*Math.PI);
    ctx.fill();
    ctx.closePath();
    drawTextCenteringWithRotate(canvas, c, 0.05, (x1+x2), (y1+y2), 0);
}

function drawMorseReceive(canvas) {
    const ctx = canvas.getContext("2d");
    const {width, height} = canvas;
    drawCoinCircle(canvas);
    drawTextCenteringWithRotate(canvas, "RECEIVE SIDE", 0.06, 0.5, 0.2, 0);
    for (const a of sendCharTable) {
        drawPointAndCharactor(canvas, a);
    }
    const starChar = '★';
    drawTextCenteringWithRotate(canvas, starChar, 0.06, 0.5, 0.3);
}

