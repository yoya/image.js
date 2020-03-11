"use strict";

/*
  2020/03/10- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    const filterSelect = document.getElementById("filterSelect");
    const filterViewCheckbox = document.getElementById("filterViewCheckbox");
    const alphaOnCheckbox = document.getElementById("alphaOnCheckbox");
    var filter     = parseInt(filterSelect.value);
    var filterView = filterViewCheckbox.checked;
    var alphaOn    = alphaOnCheckbox.checked;
    //
    var png, origArr, workArr;
    dropFunction(document, function(buf) {
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
            return ;
        }
        png.parse(arr);
        const idatArr =  png.getIDATdata();
        const inflate = new Zlib.Inflate(idatArr);
        origArr = inflate.decompress();
        workArr = new Uint8Array(origArr);
        pngFilterSummarize(png, origArr);
        if (filterView) {
            pngFilterView(png, origArr);
        } else {
            pngFilterOverwrite(png, workArr, filter, alphaOn);
        }
    }, "ArrayBuffer");
    bindFunction({"filterSelect":null,
                  "filterViewCheckbox":null,
                  "alphaOnCheckbox":null},
                 function() {
                     filterView = filterViewCheckbox.checked;
                     alphaOn       = alphaOnCheckbox.checked;
                     filter = parseInt(filterSelect.value);
                     pngFilterSummarize(png, origArr);
                     if (filterView) {
                         pngFilterView(png, origArr);
                     } else {
                         pngFilterOverwrite(png, workArr, filter, alphaOn);
                     }
                 });
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
    for (let y = 0 ; y < height ; y++) {
        workArr[offset] = filter;  // overwrite
        offset += stride;
    }
    // reconstruct PNG file
    png.deleteChunk("IDAT");
    const deflate = new Zlib.Deflate(workArr, { compressionType: 0 });
    const deflatedArr = deflate.compress();
    png.addIDATdata(deflatedArr);
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


