"use strict";
/*
  2017/01/12- yoya@awm.jp
  ref)
  - https://www.adobe.io/open/standards/TIFF.html
  - https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf
  - http://dsas.blog.klab.org/archives/52123322.html
*/

class IO_TIFF {
    constructor() {
	this.data = null;
	this.binary = null;new Binary("BigEndian");
	this.version = null;
    }
    static signature() { // "II", "MM"
	return [[0x49, 0x49], [0x4d, 0x4d]];
    }
    getTagTypeNameTable() {
        return {
            1:"BYTE",
            2:"ASCII",
            3:"SHORT",
            4:"LONG",
            5:"RATIONAL",
            7:"UNDEFINED",
            9:"SLONG",
            10:"SRATIONAL",
        };
    }
    getTagTypeName(tagType) {
        var table = this.getTagTypeNameTable();
	if (tagType in table) {
	    return table[tagType];
	}
	return "";
    }
    getTagNameTable() {
        // https://www.awaresystems.be/imaging/tiff/tifftags.html
        return {
            0x100:"ImageWidth",
            0x101:"ImageHeight",
            0x102:"BitsPerSample",
            0x103:"Compression",
            0x106:"PhotometricInterpretation",
            0x10A:"FillOrder",
            0x111:"StripOffsets",
            0x112:"Orientation",
            0x115:"SaplesPerPixel",
            //
            0x11A:"XResolution",
            0x11B:"YResolution",
            0x128:"ResolutionUnit",
        };
    }
    getTagName(tagNo) {
        var table = this.getTagNameTable();
	if (tagNo in table) {
	    return table[tagNo];
	}
	return "";
    }
    getIFDNameTable() {
        var IFDNameTable = {
            0x8825:'GPSInfo',
            0x8769:'Exif',
            0xA005:'Interoperability',
	};
        return IFDNameTable;
    }
    /*
    getIFDName(tagId) {
        var table = this.getIFDNameTable();
	if (tagId in table) {
	    return table[tagId];
	}
	return "(unknown IDFName)";
    }*/
    static verifySig(arr) {
	var sigList = this.signature();
	if (arr.length < sigList[0].length) {
	    return false; // too short
	}
	var i = 0, n;
	for (var sig of sigList) {
	    for (i = 0, n = sig.length ; i < n ; i++) {
		if (arr[i] !== sig[i]) {
		    break; // different value found
		}
	    }
	    if (i === n) {
		return true;  // completely matching
	    }
	}
	return false; // no match
    }
    parse(arr) {
        this.data = arr;
	var sigArr = arr.subarray(0, 2);
	var endian = Utils.ToText(sigArr); // "II" or "MM"
	this.binary = new Binary(endian);
	var chunk = {name:"Endian", offset:0, bytes:sigArr,
		     infos:[{offset:0, endian:endian}]};
	this.chunkList = [chunk];
	var version = this.binary.readUint16(arr, 2);
	this.version = version;
	if ((version != 0x2A) && // TIFF
            (version != 0x01BC)) { // JPEG XR
	    console.error("Invalid version:"+version);
	}
	this.chunkList.push({name:"Version", offset:2, bytes:arr.subarray(2, 4),
			infos:[{offset:2, version:version}]});
	var ifd0thPointer = this.binary.readUint32(arr, 4);
	this.chunkList.push({name:"0thIFDPointer", offset:4, bytes:arr.subarray(4, 8),
			     infos:[{offset:4, IFD0thPointer:ifd0thPointer,
                                     IFD0thPointerHex:"0x"+Utils.ToHex(ifd0thPointer, 8)}]});
	// IFD procedure
	var o = this.parseIFD(arr, ifd0thPointer, "0thIFD");

	var ifd1thPointer = this.binary.readUint32(arr, o);
	this.chunkList.push({offset:o, name:"1thIFDPointer", bytes:arr.subarray(o, o+4),
			     infos:[{offset:o, IFD1thPointer:ifd1thPointer,
                                     IFD1thPointerHex:"0x"+Utils.ToHex(ifd1thPointer, 8)}]});
	if (ifd1thPointer > 0) {
	    this.parseIFD(arr, ifd1thPointer, "1thIFD");
	}
	// chunk sort by offset
	this.chunkList.sort(function (a, b) {
	    var ao = a.offset;
	    var bo = b.offset;
	    if (ao < bo) {
		return -1;
	    } else if (ao > bo) {
		return 1;
	    }
	    return 0;
	});
    }
    parseIFD(arr, bo, name) {
	var ifdNameTable = this.getIFDNameTable();
	var infos = [];
	var nTags = this.binary.readUint16(arr, bo);
	var nBytes = 2 + 12 * nTags + 4; // nTags + Tag x 4 + IFD1Pointer
	var chunk = {offset:bo, name:name, bytes:null, infos:null};
	infos.push({offset:bo, nTags:nTags});
	let offset = bo + 2;
	for (var i = 0 ; i < nTags ; i++) {
	    var tagNo = this.binary.readUint16(arr, offset);
	    var tagType = this.binary.readUint16(arr, offset + 2);
	    var tagCount = this.binary.readUint32(arr, offset + 4);
            let tagOffsetDigit = 0;
            let tagData = null
            let o = offset + 8;
            let tagOffset = o;
            switch (tagType) {
	    case 1: // BYTE
                if (tagCount <= 4) {
                    tagOffset =  o;
                } else {
                    tagOffset =  this.binary.readUint32(arr, o);
                }
                tagData = new Uint8Array(arr.buffer, tagOffset, tagCount);
                break;
	    case 2: // ASCII
                if (tagCount <= 4) {
                    tagOffset =  o;
                } else {
		    tagOffset =  this.binary.readUint32(arr, o);
                }
		tagData = this.binary.readText(arr, o, tagCount);
                break;
	    case 3: // SHORT (unsigned)
                if (tagCount <= 2) {
                    tagOffset =  o;
                } else {
                    tagOffset = this.binary.readUint32(arr, o);
                }
                tagData = new Uint16Array(tagCount);
                for (let i = 0; i < tagCount; i++) {
                    tagData[i] = this.binary.readUint16(arr, tagOffset + i * 2);
                }
		break;
	    case 4: // LONG (unsigned)
                if (tagCount <= 1) {
                    tagOffset = o;
                } else {
                    tagOffset = this.binary.readUint32(arr, o);
                }
                tagData = new Uint32Array(tagCount);
                for (let i = 0; i < tagCount; i++) {
                    tagData[i] = this.binary.readUint32(arr, tagOffset + i * 4);
                }
                break;
	    case 5: // RATIONAL (LONG/LONG) (unsigned)
                tagOffset = this.binary.readUint32(arr, o);
                // tagData = new Float32Array(tagCount);
                tagData = new Array(tagCount);
                for (let i = 0; i < tagCount; i++) {
                    const num = this.binary.readUint32(arr, tagOffset + 2*i * 4);
                    const denom = this.binary.readUint32(arr, tagOffset + (2*i+1) * 4);
                    tagData[i] = Utils.Round(num / denom, 5);
                }
                break;
	    case 9: // SLONG
                if (tagCount <= 1) {
                    tagData = new Int32Array(1);
                    tagData[0] = this.binary.readSint32(arr, o);
                } else {
                    tagOffset = this.binary.readUint32(arr, o);
                    tagData = new Sint32Array(tagCount);
                    for (let i = 0; i < tagCount; i++) {
                        tagData[i] = this.binary.readSint32(arr, tagOffset + i * 4);
                    }
                }
                break;
	    case 10: // SRATIONAL (SLONG/SLONG)
                tagOffset = this.binary.readUint32(arr, o);
                // tagData = new Float32Array(tagCount);
                tagData = new Array(tagCount);
                for (let i = 0; i < tagCount; i++) {
                    const num = this.binary.readSint32(arr, tagOffset + 2*i * 4);
                    const denom = this.binary.readSint32(arr, tagOffset + (2*i+1) * 4);
                    tagData[i] = Utils.Round(num / denom, 5);
                }
                break;
            default:
                console.warn("unknown tagType", {tagType});
                tagOffset = this.binary.readUint32(arr, o);
		break;
	    }
            const tagNoHex = "0x"+Utils.ToHex(tagNo, 4);
            const tagName = this.getTagName(tagNo);
            const tagTypeName = this.getTagTypeName(tagType);
            const info = {offset, tagNo, tagNoHex, tagName,
                          tagType, tagTypeName,
                          tagCount, tagOffset, tagData};
            if (info.tagName === "") {
                delete info.tagName;
            }
	    infos.push(info);
	    if (tagNo in ifdNameTable) {
		this.parseIFD(arr, tagOffset, ifdNameTable[tagNo]);
	    }
	    offset += 12;
	}
	chunk.bytes = arr.subarray(bo, bo + nBytes);
	chunk.infos = infos;
	this.chunkList.push(chunk);
	return offset;
    }
    getChunkList() {
	return this.chunkList;
    }
    getICC() {
        var iccProfileData = null, iccProfileSize;
        for (var idx in this.chunkList) {
	    var chunk = this.chunkList[idx];
            if (chunk.name === "0thIFD") {
                var infos = chunk.infos;
                for (var idxInfo in infos) {
                    var info = infos[idxInfo];
                    console.log(info, info.tagNo);
                    if (info.tagNo == 8773) { // XXX
                        var byteOffset = info.tagOffset;
                        console.log(byteOffset);
                        iccProfileData = this.data.subarray(info.tagOffset,
                                                            info.tagOffset +
                                                            info.tagCount);
                        iccProfileSize = info.tagCount;
	                var iccProfileArr = new Uint8Array(iccProfileSize);
                        iccProfileArr.set(iccProfileData, 0);
                        return iccProfileArr;
                   }
                }
            }
        }
        return null;
    }
}
