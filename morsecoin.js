"use strict";
/*
 * 2022/03/25- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

let intervalID = null;
//const interval = 500;  // DEBUG
const interval = 100;
let animationTable = [];

function main() {
    // console.debug("main");
    const sendCanvas = document.getElementById("sendCanvas");
    const receiveCanvas = document.getElementById("receiveCanvas");
    const srcImage = new Image();
    const params = {};
    bindFunction({"widthHeightRange":"widthHeightText",
                  "textText":null},
                 function() {
                     const widthHeight = params['widthHeightRange'];
                     sendCanvas.width = sendCanvas.height = widthHeight;
                     receiveCanvas.width = receiveCanvas.height = widthHeight;
		     drawSrcImageAndMorse(sendCanvas, receiveCanvas, params);
		 }, params);
    bindkeyFunction(params, function(event, eventType) {
        const key = event.key;
        if (key === "Enter") {
            let delay = 0, delayAlphabet = 0;
            let textText = document.getElementById("textText").value;
            for (const c of textText.split('')) {
                const uc = c.toUpperCase();
                animationAlphabetAndPoint(uc, delay);
                delay += 2000;
            }
        } else {
            const uc = key.toUpperCase();
            if  ((uc.length === 1) && ('A' <= uc) && (uc <= 'Z')) {
                animationAlphabetAndPoint(uc, 0);
            }
        }
    });
    drawSrcImageAndMorse(sendCanvas, receiveCanvas, params);
}

function animationAlphabetAndPoint(uc, delay) {
    const morseSend = morseSendAlphabetListEntryByAlphabet(uc);
    const morseReceieve = morseReceiveAlphabetListEntryByAlphabet(uc);
    if ((! morseSend) || (! morseReceieve)) {
        return ;
    }
    const delayUnit = 500;
    const alphabetPeriod = delayUnit * morseReceieve.length - 2;
    for (let i = 1; i < morseReceieve.length; i++) {
        const c = (i == (morseReceieve.length - 1))? morseReceieve[0]:
              morseReceieve[i];
        animationPoint([uc, i-1, c], 1000, delay, 200);
        delay += delayUnit;
    }
    animationAlphabet(uc, delay, 0, delay-delayUnit);
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

function drawTextCenteringWithRotate(canvas, text, fontsize,xp, yp, rotate,
                                     color) {
    if (color === undefined) { color = "#eeee00"; }
    const ctx = canvas.getContext("2d");
    ctx.save();
    const {width, height} = canvas;
    ctx.strokeStyle = "#444422";
    ctx.fillStyle = color;
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

function animationAlphabet(uc, period, delay, attack) {
    animationAdd(
        [1, uc, attack+delay, attack, [0xee, 0xee, 0x00], [0xff, 0x00, 0xff]]
    );
    animationAdd(
        [1, uc, period+attack+delay, period, [0xff, 0x00, 0xff], [0xee, 0xee, 0x00]]);
    animationEnable();
}

function animationPoint(ucic, period, delay, attack) {
    animationAdd(
        [2, ucic, attack+delay, attack, [0xee, 0xee, 0x00], [0xff, 0x00, 0xff]]
    );
    animationAdd(
        [2, ucic, period+attack+delay, period, [0xff, 0x00, 0xff], [0xee, 0xee, 0x00]]);
    animationEnable();
}

function animationAdd(a) {
    animationTable.push(a);
}

function animationEnable() {
    if (intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
    }
    tick();
    intervalID = setInterval(tick, interval);
}
function animationDisable() {
    if (intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
    }
}

function interpolateColor(startColor, endColor, ratio) {
    const [r1, g1, b1] = startColor;
    const [r2, g2, b2] = endColor;
    const r = Math.round(r1*(1-ratio) + r2*ratio);
    const g = Math.round(g1*(1-ratio) + g2*ratio);
    const b = Math.round(b1*(1-ratio) + b2*ratio);
    return "rgb("+r+","+g+","+b+")";
}

function tick() {
    //console.debug("tick:");
    let remain = false;
    for (const i in animationTable) {
        const a = animationTable[i];
        if (a === null) {  continue;  }  // skip empty entry
        const [type, alphabet, timer, timerMax, startColor, endColor] = a;
        if (timer < timerMax) {
            const color = interpolateColor(startColor, endColor,
                                           1 - (timer/timerMax));
            switch (type) {
            case 1:
                tickAlphabet(alphabet, color);
                break;
            case 2:
                tickPoint(alphabet, color);
                break;
            }
        }
        a[2] = timer - interval;
        if (a[2] >= 0) {
            remain = true;
        } else {
            animationTable[i] = null;
        }
    }
    if (remain === false) {
        animationDisable();
        animationTable = [];
    }
}

function  tickAlphabet(alphabet, color) {
    const sendCanvas = document.getElementById("sendCanvas");
    const canvas = document.getElementById("receiveCanvas");
    drawMorseSendAlphabet(sendCanvas, alphabet, color);
    drawMorseReceiveAlphabet(canvas, alphabet, color);
}

function tickPoint(alphabet, color) {
    const [uc, idx, c] = alphabet;
    const sendCanvas = document.getElementById("sendCanvas");
    const canvas = document.getElementById("receiveCanvas");
    drawMorseSendPoint(sendCanvas, uc, color, idx);
    drawMorseReceivePoint(canvas, c, color);
}
