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
    getIFDNameTable() {
        var IFDNameTable = {
            0x8825:'GPSInfo',
            0x8769:'Exif',
            0xA005:'Interoperability',
	};
        return IFDNameTable;
    }
    getIFDName(tagId) {
        var table = this.getIFDNameTable();
	if (tagId in table) {
	    return table[tagId];
	}
	return "(unknown)";
    }
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
                                     IFD0thPointerHex:"0x"+Utils.ToHex(ifd0thPointer)}]});
	// IFD procedure
	var o = this.parseIFD(arr, ifd0thPointer, "0thIFD");

	var ifd1thPointer = this.binary.readUint32(arr, o);
	this.chunkList.push({offset:o, name:"1thIFDPointer", bytes:arr.subarray(o, o+4),
			     infos:[{offset:o, IFD1thPointer:ifd1thPointer,
                                     IFD1thPointerHex:"0x"+Utils.ToHex(ifd1thPointer)}]});
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
 	var o = bo + 2;
	for (var i = 0 ; i < nTags ; i++) {
	    var tagNo = this.binary.readUint16(arr, o);
	    var tagType = this.binary.readUint16(arr, o + 2);
	    var tagCount = this.binary.readUint32(arr, o + 4);
	    var tagOffset = this.binary.readUint32(arr, o + 8);
            switch (tagType) {
	      case 1: // BYTE
		if (tagCount <= 4)
                    console.debug(this.binary);
		    tagOffset = this.binary.readUint8(arr, o + 8);
                break;
	      case 3: // SHORT
		if (tagCount <= 2)
		    tagOffset = this.binary.readUint16(arr, o + 8);
		break;
	    }
            const tagNoHex = "0x"+Utils.ToHex(tagNo);
            const tagOffsetHex = "0x"+Utils.ToHex(tagOffset);
	    infos.push({offset:o, tagNo:tagNo, tagNoHex:tagNoHex,
                        tagType:tagType, tagCount:tagCount,
                        tagOffset:tagOffset, tagOffsetHex:tagOffsetHex});
	    if (tagNo in ifdNameTable) {
		this.parseIFD(arr, tagOffset, ifdNameTable[tagNo]);
	    }
	    o += 12;
	}
	chunk.bytes = arr.subarray(bo, bo + nBytes);
	chunk.infos = infos;
	this.chunkList.push(chunk);
	return o;
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
