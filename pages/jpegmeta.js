"use strict";

/*
  2023/04/21- yoya@awm.jp
  ref) https://exiftool.org/TagNames/JPEG.html
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

image.onload = () => {
    imageCaption.innerText = image.naturalWidth + "x" + image.naturalHeight;
}

function main() {
    dropFunction(document, function(arrbuf) {
        jpegContainer.style.display = "none";
        // display Image
        const reader = new FileReader();
        reader.onload = () => {
	    const url = reader.result;
            image.src = url;
        }
        const blob = new Blob([arrbuf]);
        reader.readAsDataURL(blob);
        // JPEG dump
        const arr = new Uint8Array(arrbuf);
        if (IO_JPEG.verifySig(arr)) {
            jpegContainer.style.display = "block";
            dump(arr);
        } else {
            imageCaption.innerText = "not a JPEG File";
        }
    }, "ArrayBuffer");
}

function dump(arr, img) {
    let jpeg = new IO_JPEG();
    jpeg.parse(arr);
    const chunkList = jpeg.getChunkList();
    const jfif = jpeg.getJFIF();
    const exif = jpeg.getExif();
    const icc = jpeg.getICC();
    const adobe = jpeg.getAdobe();

    chunkCaption.innerText = "Chunk Num:" + chunkList.length;
    const items = chunkFunction(chunkList);
    makeItems(chunkContainer, items);

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
    if (adobe) {
        adobeCaption.innerText = "byte length:" + adobe.length;
        const items = adobeFunction(adobe);
        makeItems(adobeContainer, items);
    } else {
        adobeCaption.innerText = "APP14 not found";
        makeItems(adobeContainer, []);
    }
    console.debug(chunkList);
}

function chunkFunction(chunkList) {
    const items = [];
    chunkList.forEach((chunk) => {
        items.push(chunk.name);
    });
    return items;
}

function jfifFunction(jfif) {
    const items = [];
    const [ver1, ver2, units, xd1, xd2, yd1, yd2, xThumb, yThumb] = jfif;
    const version = ver1 + "." + Utils.LeftPad(ver2, 2, "0");
    const xDensity = xd1 * 0x100  + xd2;
    const yDensity = yd1 * 0x100  + yd2;
    items.push("[JFIF version] " + version);
    const unitsStr = ["aspect ratio", "inch (DPI)", "cm"][units];
    items.push("[Density] " + xDensity +":" + yDensity + " (" + unitsStr + ")");
    const thumb = "width:" + xThumb + " height:" + yThumb;
    const thumbNote = ((xThumb * yThumb) === 0)? " (nothing)" : "";
    items.push("[Thumbnail] " + thumb + thumbNote);
    return items;
}

function exifFunction(arr) {
    const items = [];
    let exif = new IO_TIFF();
    exif.parse(arr);
    const chunkList = exif.getChunkList();
    console.log(exif, chunkList);
    chunkList.forEach((chunk) => {
        switch (chunk.name) {
        case "Endian":
            items.push("[Endian] " + chunk.infos[0].endian);
            break;
        case "Version":
            items.push("[Version] " + chunk.infos[0].version);
            break;
        case "0thIFD":
            for (const info of chunk.infos) {
                const { tagNo, tagNoHex } = info;
                let tagName = info.tagName;
                if (tagName !== undefined) {
                    tagName = " " + tagName; // format
                }
                if (tagNo) {
                    console.debug({ ...info} );
                    let note = "";
                    switch (tagNo) {
                    case 0x128: // Resolutin Unit
                        switch (info.tagData[0]) {
                        case 2:
                            note = " (inch)";
                            break;
                        case 3:
                            note = " (cm)";
                            break;
                        }
                        break;
                    }
                    items.push("[" + tagNo + "(" + tagNoHex + ")"+tagName+"] " + info.tagData + note);
                }
            }
            break;
        }
    });
    return items;
}

function iccFunction(arr) {
    const items = [];
    let icc = new IO_ICC();
    icc.parse(arr);
    const version = icc.header.ProfileVersion.Major + "." + icc.header.ProfileVersion.Minor;
    let {Year, Month, Day, Hours, Minutes, Seconds} = icc.header.DateTimeCreated;
    [Hours, Minutes, Seconds] = [Hours, Minutes, Seconds].map((v) => { return Utils.LeftPad(v, 2, "0")})
    const created = Year + "/" + Month + "/" + Day + "_" +
          Hours + ":" + Minutes + ":" + Seconds;
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

function adobeFunction(adobe) {
    const items = [];
    const [ver1, ver2, f0_1, f0_2, f1_1, f1_2, tr] = adobe;
    const version = "0x" + Utils.LeftPad(ver1 * 0x100 + ver2, 4, "0");
    const flag0 = "0x" + Utils.LeftPad(f0_1 * 0x100  + f0_2, 4, "0");
    const flag1 = "0x" + Utils.LeftPad(f1_1 * 0x100  + f1_2, 4, "0");
    items.push("[Adobe segment version] " + version);
    items.push("[flag0] " + flag0 + ", [flag1] " + flag1);
    const trStr = ["RGB or CMYK", "YCbCr", "YCCK - inversed CMYK"][tr];
    items.push("[Transform] " + tr + " (" + trStr + ")");
    console.log({adobe, items});
    return items;
}


function makeItems(target, items) {
    target.innerHTML = "";
    addItems(target, items);
}

function addItems(target, items) {
    for (const item of items) {
        const div = document.createElement("div");
        div.innerText = item;
        div.className = "leaf";
        target.appendChild(div);
    }
}
