"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    var filterSelect = document.getElementById("filterSelect");
    var filter = parseInt(filterSelect.value);
    dropFunction(document, function(buf) {
        let arr = new Uint8Array(buf);
        pngFilter(arr, filter);
        //
        const blob = new Blob([arr], {type: 'image/png'});
        const url = window.URL.createObjectURL(blob);
        const img = document.getElementById('srcImage');
        img.src = url;
    }, "ArrayBuffer");
    bindFunction({"filterSelect":null},
                 function() {
                     var filter = parseInt(filterSelect.value);
                     pngFilter(arr, filter);
                 });
}

function pngFilter(arr, filter) {
    //
    let png = new IO_PNG();
    png.parse(arr);
    let ihdrChunk = png.getIHDRchunk();
    let infos      = ihdrChunk.infos;
    const width      = infos[2].width;
    const height     = infos[3].height;
    const bitDepth   = infos[4].bitDepth;
    const colourType = infos[5].colourType;
    const interlace  = infos[8].interlaceMethod;
    console.debug("IHDR", width, height, bitDepth, colourType, interlace);
    let idatArr =  png.getIDATdata();
    // console.debug(idatArr);
    var inflate = new Zlib.Inflate(idatArr);
    var inflatedArr = inflate.decompress();
    //
    const ncomp = png.getNCompByColourType(colourType);
    const stride = (1 + Math.ceil(width * ncomp * bitDepth / 8)) | 0;
    let offset = 0;
    let filterTable = [0, 0, 0, 0, 0];  // 0-4 entry zero initialize
    for (let y = 0 ; y < height ; y++) {
        let f = inflatedArr[offset];
        filterTable[f]++;
        inflatedArr[offset] = filter;  // overwrite
        offset += stride;
    }
    //
    png.deleteChunk("IDAT");
    var deflate = new Zlib.Deflate(inflatedArr);
    var deflatedArr = deflate.compress();
    console.debug("deflatedArr", deflatedArr);
    png.addIDATdata(deflatedArr);
    let PNGarr = png.build();
    //
    const blob = new Blob([PNGarr], {type: 'image/png'});
    const url = window.URL.createObjectURL(blob);
    const img = document.getElementById('dstImage');
    img.src = url;
}


