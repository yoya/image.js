"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

image.onload = () => {
    imageCaption.innerText = image.naturalWidth + "x" + image.naturalHeight;
}

function main() {
    dropFunction(document, function(arrbuf) {
        const reader = new FileReader();
        reader.onload = () => {
	    const url = reader.result;
            image.src = url;
        }
        const blob = new Blob([arrbuf]);
        reader.readAsDataURL(blob);
        const arr = new Uint8Array(arrbuf);
        dump(arr);
    }, "ArrayBuffer");
}

function dump(arr) {
    let jpeg = new IO_JPEG();
    jpeg.parse(arr);
    const jfif = jpeg.getJFIF();
    const exif = jpeg.getExif();
    const icc = jpeg.getICC();
    const chunkList = jpeg.getChunkList();
    console.debug( {chunkList });
    if (jfif) {
        jfifCaption.innerText = "byte length:" + jfif.length;
        const items = jfifFunction(jfif);
        makeItems(jfifContainer, items);
    } else {
        jfifCaption.innerText = "APP0-JFIF not found";
        makeItems(jfifContainer, []);
    }
    if (exif) {
        exifCaption.innerText = "byte length:" + exif.length;
        const items = exifFunction(exif);
        makeItems(exifContainer, items);
    } else {
        exifCaption.innerText = "APP1-Exif not found";
        makeItems(exifContainer, []);
    }
    if (icc) {
        iccCaption.innerText = "byte length:" + icc.length;
        const items = iccFunction(icc);
        makeItems(iccContainer, items);
    } else {
        iccCaption.innerText = "APP2-ICC_Profile not found";
        makeItems(iccContainer, []);
    }
    console.debug(chunkList);
}

function jfifFunction(jfif) {
    const items = [];
    const [ver1, ver2, units, xd1, xd2, yd1, yd2, xThumb, yThumb] = jfif;
    const version = ver1 + "." + Utils.LeftPad(ver2, 2, "0");
    const xDensity = xd1 * 0xff  + xd2;
    const yDensity = yd1 * 0xff  + yd2;
    items.push("JFIF version: " + version);
    const unitsStr = ["aspect ratio", "inch (DPI)", "cm"][units];
    items.push("Density: " + xDensity +":" + yDensity + " (" + unitsStr + ")");
    items.push("Thumbnail: " + xThumb + "x" + yThumb);
    return items;
}

function exifFunction(arr) {
    const items = [];
    let exif = new IO_TIFF();
    exif.parse(arr);
    console.log({exif});
    return items;
}

function iccFunction(arr) {
    const items = [];
    let icc = new IO_ICC();
    icc.parse(arr);
    console.log({icc});
    const version = icc.header.ProfileVersion.Major + "." + icc.header.ProfileVersion.Minor;
    const dt = icc.header.DateTimeCreated;
    const created = dt.Year + "/" + dt.Month + "/" + dt.Day + " " +
          dt.Hours + ":" + dt.Minutes + ":" + dt.Seconds;
    const headerKeys = [["AcspSignature", "acsp"],
                        ["ColorSpace", "colorspace"],
                        ["ConnectionSpace", "pcs"],
                        ["PrimaryPlatform", "platform"],
                        ["ProfileDeviceClass", "device"]];
    const headers = [];
    headers.push("version:" + version);
    headers.push("created:" + created);
    for (const h of headerKeys) {
        const v = icc.header[h[0]];
        headers.push(h[1]+":"+v);
    }
    items.push("[header] " + headers.join(" "));
    for (const tag of icc.tagTable) {
        const sig = tag.Signature;
        console.log({tag, sig});
        switch (sig) {
        case "cprt":
        case "desc":
            const arr = tag.arr.subarray(tag.Offset,
                                         tag.Offset + tag.Size);
            items.push("["+sig+"] "+ Utils.ToText(arr));
            break;
        }
    }
    return items;
}

function makeItems(target, items) {
    target.innerHTML = "";
    for (const item of items) {
        const div = document.createElement("div");
        div.innerText = item;
        div.className = "leaf";
        target.appendChild(div);
    }
}
