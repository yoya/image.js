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
    bindFunction({"widthHeight":"widthHeightText"},
		 function() {
		     drawPrime6(canvas, params);
		 }, params);
    drawPrime6(canvas, params);
}

function isPrime(n) {
    const n2 = Math.ceil(Math.sqrt(n));
    for (let i = 2; i < n2; i++) {
        if ((n % i) === 0) {
            return false;
        }
    }
    return true;
}

function drawPrime6(canvas, params) {
    // console.debug("drawCopy");
    const ctx = canvas.getContext("2d");
    const { widthHeight } = params;
    const width = widthHeight;
    const height = widthHeight;
    console.log(params, {width, height });
    canvas.width  = width;
    canvas.height = height;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    const n = 500;
    const cx = width / 2;  // center
    const cy = height / 2;
    const gap = 20;
    for (let i = 1 ; i < n; i++) {
        const t = (i - 1) % 6;  // ６つのうち何個目(0数え)
        const d = ((i + 5)/6) | 0;  // 中心から何番目(1数え)
        const x = cx + gap * d * Math.sin(t / 6 * (2 * 3.14159));
        const y = cy - gap * d * Math.cos(t / 6 * (2 * 3.14159));
        ctx.save();
        if (isPrime(i)) {
            ctx.fillStyle = "#FE0";
        } else {
            ctx.fillStyle = "cyan";
        }
        ctx.textAlign = "center";
        ctx.fillText(String(i), x, y);
    }
}
