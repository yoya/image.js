"use strict";
/*
 * 2024/11/08- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const canvas = document.getElementById("canvas");
    const params = {};
    bindFunction({"widthHeight":"widthHeightText",
                  "period":"periodText"},
		 function() {
		     drawPrime6(canvas, params);
		 }, params);
    drawPrime6(canvas, params);
}

function isPrime(n) {
    const n2 = Math.sqrt(n);
    for (let i = 2; i < n2; i++) {
        if ((n % i) === 0) {
            return false;
        }
    }
    return true;
}

function drawText(ctx, x, y, text, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawPrime6(canvas, params) {
    // console.debug("drawCopy");
    const ctx = canvas.getContext("2d");
    const { widthHeight, period } = params;
    const width = widthHeight;
    const height = widthHeight;
    console.log(params, {width, height });
    canvas.width  = width;
    canvas.height = height;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    const n = 100 * period * width / 2048;  // あてずっぽの閾値
    const cx = width / 2;  // center
    const cy = height / 2;
    const gap1 = period*1.5 + 12;

    drawText(ctx, cx, cy, String(0), "gray");
    for (let i = 1 ; i < n; i++) {
        const t = (i - 1) % period;  // N(初期値:6)つのうち何個目(0数え)
        const d = ((i - 1)/period) | 0;  // 中心から何番目(0数え)
        const gap2 = 20;
        const r = gap1 + gap2 * d 
        const x = cx + r * Math.sin(t / period * (2 * 3.14159));
        const y = cy - r * Math.cos(t / period * (2 * 3.14159));
        if (isPrime(i)) {
            drawText(ctx, x, y, String(i), "#FE0");
        } else {
            drawText(ctx, x, y, String(i), "cyan");
        }
        
    }
}
