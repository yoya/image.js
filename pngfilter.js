"use strict";

/*
  2020/03/10- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    const filterSelect = document.getElementById("filterSelect");
    var filter = parseInt(filterSelect.value);
    var png, origArr, workArr;
    dropFunction(document, function(buf) {
        const arr = new Uint8Array(buf);
        png = new IO_PNG();
        png.parse(arr);
        const idatArr =  png.getIDATdata();
        const inflate = new Zlib.Inflate(idatArr);
        origArr = inflate.decompress();
        workArr = new Uint8Array(origArr);
        pngFilterSummarize(png, origArr);
        pngFilter(png, workArr, filter);
        // display srcImage
        const blob = new Blob([arr], {type: 'image/png'});
        const url = window.URL.createObjectURL(blob);
        const img = document.getElementById('srcImage');
        img.src = url;
    }, "ArrayBuffer");
    bindFunction({"filterSelect":null},
                 function() {
                     filter = parseInt(filterSelect.value);
                     pngFilterSummarize(png, origArr);
                     pngFilter(png, workArr, filter);
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
    let summarize = document.getElementById('filterSummarize');
    summarize.innerHTML = "filterSummary = " +
        '<font color="red">0</font>:'+filterTable[0] +
        ', <font color="yellow">1</font>:'+filterTable[1] +
        ', <font color="green">2</font>:'+filterTable[2] +
        ', <font color="blue">3</font>:'+filterTable[3] +
        ', <font color="purple">4</font>:'+filterTable[4];
}
function pngFilter(png, workArr, filter) {
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
    const img = document.getElementById('dstImage');
    img.src = url;
}


