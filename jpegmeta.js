"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    dropFunction(document, function(arrbuf) {
        var arr = new Uint8Array(arrbuf);
        dump(arr);
        imageContainer.innerHTML = "";
        const blob = new Blob([arrbuf]);
        const reader = new FileReader();
        reader.onload = function() {
	    const url = this.result;
            //const img = document.createElement("img");
            const img = new Image();
            img.onload = () => {
                const sizeStr = img.naturalWidth + "x" + img.naturalHeight;
                imageSize.innerText = sizeStr;
                imageContainer.appendChild(img);
            }
            img.src = url;
        }
        reader.readAsDataURL(blob);
    }, "ArrayBuffer");
}

function dump(arr) {
    let io = new IO_JPEG();
    io.parse(arr);
    console.log(arr, io);
    const jfif = io.getJFIF();
    const exif = io.getExif();
    const iccdata = io.getICC();
    const chunkList = io.getChunkList();
    if (jfif) {
        const items = [];
        const [ver1, ver2, units, xd1, xd2, yd1, yd2, xThumb, yThumb] = jfif;
        const version = ver1 + "." + Utils.LeftPad(ver2, 2, "0");
        const xDensity = xd1 * 0xff  + xd2;
        const yDensity = yd1 * 0xff  + yd2;
        const td = [version, units, xDensity, yDensity, xThumb, yThumb];
        items.push("JFIF version: " + version);
        items.push("Density: " + xDensity +":" + yDensity + " ("+["aspect ratio", "inch", "cm"][units] + ")");
        items.push("Thumbnail: " + xThumb + "x" + yThumb);
        makeItems(jfifContainer, items);
    } else {
        makeItems(jfifContainer, ["JFIF not found"]);
    }
    if (exif) {
        console.log({ exif });
    }
    console.debug(chunkList);
}

function makeItems(target, items) {
    target.innerHTML = "";
    for (let item of items) {
        const div = document.createElement("div");
        div.innerText = item;
        div.className = "leaf";
        target.appendChild(div);
    }
}
