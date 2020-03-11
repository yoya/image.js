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
        pngFilter(png, origArr, workArr, filter);
        // display srcImage
        const blob = new Blob([arr], {type: 'image/png'});
        const url = window.URL.createObjectURL(blob);
        const img = document.getElementById('srcImage');
        img.src = url;
    }, "ArrayBuffer");
    bindFunction({"filterSelect":null},
                 function() {
                     filter = parseInt(filterSelect.value);
                     pngFilter(png, origArr, workArr, filter);
                 });
}

function pngFilter(png, origArr, workArr, filter) {
    const ihdrChunk = png.getIHDRchunk();
    const infos      = ihdrChunk.infos;
    const width      = infos[2].width;
    const height     = infos[3].height;
    const bitDepth   = infos[4].bitDepth;
    const colourType = infos[5].colourType;
    const interlace  = infos[8].interlaceMethod;
    // console.debug("IHDR", width, height, bitDepth, colourType, interlace);
    //
    const ncomp = png.getNCompByColourType(colourType);
    const stride = (1 + Math.ceil(width * ncomp * bitDepth / 8)) | 0;
    let offset = 0;
    let filterTable = [0, 0, 0, 0, 0];  // 0-4 entry zero initialize
    for (let y = 0 ; y < height ; y++) {
        let f = origArr[offset];
        filterTable[f]++;
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


