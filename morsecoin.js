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
    bindFunction({"widthHeightRange":"widthHeightText"},
		 function() {
                     const widthHeight = params['widthHeightRange'];
                     sendCanvas.width = sendCanvas.height = widthHeight;
                     receiveCanvas.width = receiveCanvas.height = widthHeight;
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
    //
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.fillStyle = "#666600";
    ctx.arc(wc, hc, wc*scale2, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawTextCenteringWithRotate(canvas, text, fontsize,xp, yp, rotate) {
    const ctx = canvas.getContext("2d");
    ctx.save();
    const {width, height} = canvas;
    //ctx.strokeStyle = "#aaaa00";
    ctx.strokeStyle = "#444422";
    ctx.fillStyle = "#eeee00";
    ctx.font = "bold " + (width*fontsize)+"px sans-serif"
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const x = xp * width, y = yp * height;
    ctx.translate(x, y);
    ctx.rotate(rotate);
    ctx.translate(-x, -y);
    ctx.fillText(text, x, y);
    ctx.strokeText(text, x, y);
    ctx.restore();
}

function drawMorseSend(canvas) {
    const ctx = canvas.getContext("2d");
    drawCoinCircle(canvas);
    drawTextCenteringWithRotate(canvas, "SEND", 0.06, 0.35, 0.2,
                                -20*Math.PI/180);
    drawTextCenteringWithRotate(canvas, "SIDE", 0.06, 0.65, 0.2,
                                20*Math.PI/180);
}

const receiveLineTable = [
    [0.18, 0.32, 0.780, 0.32],  // H - O
    // left
    [0.42, 0.32, 0.42, 0.82], // E - J
    [0.42, 0.64, 0.20, 0.64], // R - L
    [0.42, 0.76, 0.31, 0.76], // P
    [0.26, 0.32, 0.26, 0.43], // S-V
    [0.34, 0.32, 0.34, 0.51, 0.29, 0.56],  // I-U-F
    // right
    [0.65, 0.32, 0.65, 0.80], // M - B
    [0.74, 0.32,0.74, 0.50], // O-Z
    [0.74, 0.41, 0.84, 0.41], // G-Q
    [0.65, 0.60, 0.84, 0.60], // N-Y
    [0.785, 0.60, 0.785, 0.66], // Y-C
    [0.65, 0.72, 0.74, 0.72], // D-X
];

function drawReceivelines(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.save();
    const {width, height} = canvas;
    for (const a of receiveLineTable) {
        const [x1, y1, x2, y2, x3, y3] = a;
        ctx.beginPath();
        ctx.strokeStyle = "#eeee00";
        ctx.lineWidth = width * 0.005;
        if (x3 && y3) {
            ctx.moveTo(x1*width, y1*height);
            ctx.lineTo(x2*width, y2*height);
            //ctx.lineTo(x3*width, y3*height);
            ctx.arc(x3*width, y2*height, (x2-x3)*width, 0, Math.PI/2);
        } else {
            ctx.moveTo(x1*width, y1*height);
            ctx.lineTo(x2*width, y2*height);
        }
        ctx.stroke();
    }
    ctx.restore();
}

const sendCharTable = [
    // left hand
    [0.18, 0.32, 'H', 0.02, -0.04, 'p'],
    [0.26, 0.32, 'S', 0.01, -0.04, 'p'],
    [0.34, 0.32, 'I', 0.00, -0.04, 'p'],
    [0.42, 0.32, 'E', 0.00, -0.04, 'p'],
    // left down
    [0.42, 0.43, 'A', 0.03, 0, 'v'],
    [0.42, 0.70, 'W', 0.04, 0, 'v'],
    [0.42, 0.82, 'J', 0.03, 0, 'v'],
    //
    [0.26, 0.43, 'V', 0.03, 0, 'v'],
    [0.34, 0.43, 'U', 0.03, 0, 'v'],
    [0.29, 0.56, 'F', -0.01, -0.04, 'p'],
    //
    [0.38, 0.64, 'R', 0.00, -0.04, 'p'],
    [0.20, 0.64, 'L', 0.00, -0.04, 'p'],
    [0.31, 0.76, 'P', 0.00, -0.04, 'p'],
    // right hand
    [0.590, 0.32, 'T', 0.00, -0.04, 'h'],
    [0.690, 0.32, 'M', 0.00, -0.04, 'h'],
    [0.790, 0.32, 'O', -0.01, -0.04, 'h'],
    //
    // right down
    [0.65, 0.60, 'N', -0.04, 0, 'p'],
    [0.65, 0.72, 'D', -0.04, 0, 'p'],
    [0.65, 0.80, 'B', -0.04, 0, 'p'],
    //
    [0.74, 0.41, 'G', -0.04, 0, 'p'],
    [0.74, 0.50, 'Z', 0.04, 0, 'p'],
    [0.84, 0.41, 'Q', -0.01, -0.04, 'h'],
    //
    [0.72, 0.60, 'K', 0, -0.04, 'h'],
    [0.84, 0.60, 'Y', 0, -0.04, 'h'],
    [0.785, 0.66, 'C', 0.04, 0, 'p'],
    [0.74, 0.72, 'X', 0, -0.04, 'h'],
    
];

function drawPointAndCharactor(canvas, a) {
    const ctx = canvas.getContext("2d");
    const {width, height} = canvas;
    const [x1, y1, c, x2, y2, p] = a;
    ctx.fillStyle = "#eeee00";
    ctx.beginPath();
    switch(p) {
    case 'p':
        ctx.arc(x1*width, y1*height, width*0.01, 0, 2*Math.PI);
        break;
    case 'h':
        {
            const xlen = 0.055;
            const ylen = 0.015;
            ctx.rect((x1 - xlen/2)*width, (y1-ylen/2)*height, width*xlen, height*ylen);
        }
        break;
    case 'v':
        {
            const xlen = 0.015;
            const ylen = 0.05;
            ctx.rect((x1 - xlen/2)*width, (y1-ylen/2)*height, width*xlen, height*ylen);
        }
        break;
    }
    ctx.fill();
    drawTextCenteringWithRotate(canvas, c, 0.05, (x1+x2), (y1+y2), 0);
}

function drawMorseReceive(canvas) {
    const ctx = canvas.getContext("2d");
    const {width, height} = canvas;
    drawCoinCircle(canvas);
    drawReceivelines(canvas);
    drawTextCenteringWithRotate(canvas, "RECEIVE SIDE", 0.06, 0.5, 0.2, 0);
    for (const a of sendCharTable) {
        drawPointAndCharactor(canvas, a);
    }
    const starChar = '★';
    drawTextCenteringWithRotate(canvas, starChar, 0.07, 0.5, 0.325);
}

