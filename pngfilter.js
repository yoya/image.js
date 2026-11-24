"use strict";

/*
  2020/03/10- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    const params = {};  // filter ("" or "0".."4"), filterView, alphaOn
    //
    var png, origArr, workArr;
    dropFunction(document, async function(buf) {
        const arr = new Uint8Array(buf);
        // display srcImage
        const blob = new Blob([arr], {type: 'image/png'});
        const url = window.URL.createObjectURL(blob);
        const img = document.getElementById('srcImage');
        img.src = url;
        //
        png = new IO_PNG();
        if (! IO_PNG.verifySig(arr)) {
            let console = document.getElementById('console');
            console.innerHTML = "not PNG!";
            origArr = workArr = null;  // forget the previous PNG
            return ;
        }
        png.parse(arr);
        const idatArr =  png.getIDATdata();
        try {
            origArr = await IO_PNG.inflate(idatArr);
        } catch (e) {
            document.getElementById('console').innerHTML = "IDAT inflate failed: " + e.message;
            origArr = workArr = null;
            return ;
        }
        workArr = new Uint8Array(origArr);
        pngFilterSummarize(png, origArr);
        if (params.filterView) {
            pngFilterView(png, origArr);
        } else {
            pngFilterOverwrite(png, workArr, params.filter, params.alphaOn);
        }
    }, "ArrayBuffer");
    bindParams(params, function(key, target, rel) {
                     if (! origArr) {
                         return ;  // no PNG loaded yet
                     }
                     pngFilterSummarize(png, origArr);
                     if (params.filterView) {
                         pngFilterView(png, origArr);
                     } else {
                         pngFilterOverwrite(png, workArr, params.filter, params.alphaOn);
                     }
                 }, {keys: ["filter", "filterView", "alphaOn"]});
}

function pngFilterSummarize(png, origArr) {
    const stride = png.getImageStride();
    const height = png.getImageHeight()
    let offset = 0;
    let filterTable = [0, 0, 0, 0, 0];  // 0-4 entry zero initialize
    for (let y = 0 ; y < height ; y++) {
        let f = origArr[offset];
        filterTable[f]++;
        offset += stride;
    }
    let console = document.getElementById('console');
    console.innerHTML = "filterSummary = " +
        '<font color="red">0</font>:'+filterTable[0] +
        ', <font color="yellow">1</font>:'+filterTable[1] +
        ', <font color="green1">2</font>:'+filterTable[2] +
        ', <font color="cyan">3</font>:'+filterTable[3] +
        ', <font color="violet">4</font>:'+filterTable[4];
}
function pngFilterView(png, origArr) {
    const width = png.getImageWidth()
    const height = png.getImageHeight()
    const stride = png.getImageStride();
    let canvas = document.getElementById('dstCanvas');
    let ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    let offset = 0;
    for (let y = 0 ; y < height ; y++) {
        let f = origArr[offset];
        let color = ["red", "yellow", "rgb(0,255,0)", "cyan", "violet"][f];
        ctx.fillStyle = color;
        ctx.fillRect(0, y, width, 1);
        offset += stride;
    }
}

function pngFilterOverwrite(png, workArr, filter, alphaOn) {
    const stride = png.getImageStride();
    const height = png.getImageHeight()
    let offset = 0;
    let filterTable = [0, 0, 0, 0, 0];  // 0-4 entry zero initialize
    if (filter !== "") {
        for (let y = 0 ; y < height ; y++) {
            workArr[offset] = filter;  // overwrite
            offset += stride;
        }
    }
    // reconstruct PNG file
    png.deleteChunk("IDAT");
    png.addIDATdata(zlibStored(workArr));
    let PNGarr = png.build();
    // display dstImage
    const blob = new Blob([PNGarr], {type: 'image/png'});
    const url = window.URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function() {
        let canvas = document.getElementById('dstCanvas');
        let ctx = canvas.getContext("2d");
        let width = img.width, height = img.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height, 0, 0, width, height);
        console.log({"alphaOn":alphaOn});
        if (! alphaOn) {
            let imageData = ctx.getImageData(0, 0, width, height);
            alphaOff(imageData);
            ctx.putImageData(imageData, 0, 0);
        }
    }
    img.src = url;
}



// 無圧縮 (stored ブロック) の zlib 形式 (RFC1950/1951) を作る
function zlibStored(arr) {
    const maxBlock = 0xFFFF;
    const nBlocks = Math.max(1, Math.ceil(arr.length / maxBlock));
    const out = new Uint8Array(2 + nBlocks * 5 + arr.length + 4);
    out[0] = 0x78;  // CMF: deflate, 32K window
    out[1] = 0x01;  // FLG: (0x78 * 256 + 0x01) % 31 === 0
    let o = 2;
    for (let b = 0; b < nBlocks; b++) {
        const start = b * maxBlock;
        const len = Math.min(maxBlock, arr.length - start);
        out[o++] = (b === nBlocks - 1) ? 1 : 0;  // BFINAL, BTYPE=00
        out[o++] = len & 0xFF;
        out[o++] = len >> 8;
        out[o++] = ~len & 0xFF;
        out[o++] = (~len >> 8) & 0xFF;
        out.set(arr.subarray(start, start + len), o);
        o += len;
    }
    let a = 1, s = 0;  // Adler-32
    for (let i = 0; i < arr.length; i++) {
        a = (a + arr[i]) % 65521;
        s = (s + a) % 65521;
    }
    out[o++] = s >> 8; out[o++] = s & 0xFF;
    out[o++] = a >> 8; out[o++] = a & 0xFF;
    return out;
}
