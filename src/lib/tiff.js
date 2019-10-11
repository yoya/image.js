'use strict';
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
	this.binary = null; new Binary('BigEndian');
	this.version = null;
    }

    static signature() { // "II", "MM"
	return [[0x49, 0x49], [0x4d, 0x4d]];
    }

    getIFDNameTable() {
        const IFDNameTable = {
            0x8825:'GPSInfo',
            0x8769:'Exif',
            0xA005:'Interoperability'
	};
        return IFDNameTable;
    }

    getIFDName(tagId) {
        const table = this.getIFDNameTable();
	if (tagId in table) {
	    return table[tagId];
	}
	return '(unknown)';
    }

    static verifySig(arr) {
	const sigList = this.signature();
	if (arr.length < sigList[0].length) {
	    return false; // too short
	}
	let i = 0; let n;
	for (const sig of sigList) {
	    for (i = 0, n = sig.length; i < n; i++) {
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
	const sigArr = arr.subarray(0, 2);
	const endian = Utils.ToText(sigArr); // "II" or "MM"
	this.binary = new Binary(endian);
	const chunk = {
 name:'Endian',
offset:0,
bytes:sigArr,
		     infos:[{ offset:0, endian:endian }]
};
	this.chunkList = [chunk];
	const version = this.binary.readUint16(arr, 2);
	this.version = version;
	if ((version != 0x2A) && // TIFF
            (version != 0x01BC)) { // JPEG XR
	    console.error('Invalid version:' + version);
	}
	this.chunkList.push({
name:'Version',
offset:2,
bytes:arr.subarray(2, 4),
			infos:[{ offset:2, version:version }]
});
	const ifd0thPointer = this.binary.readUint32(arr, 4);
	this.chunkList.push({
name:'0thIFDPointer',
offset:4,
bytes:arr.subarray(4, 8),
			     infos:[{ offset:4, IFD0thPointer:Utils.ToHex(ifd0thPointer) }]
});
	// IFD procedure
	const o = this.parseIFD(arr, ifd0thPointer, '0thIFD');

	const ifd1thPointer = this.binary.readUint32(arr, o);
	this.chunkList.push({
offset:o,
name:'1thIFDPointer',
bytes:arr.subarray(o, o + 4),
			     infos:[{ offset:o, IFD1thPointer:Utils.ToHex(ifd1thPointer) }]
});
	if (ifd1thPointer > 0) {
	    this.parseIFD(arr, ifd1thPointer, '1thIFD');
	}
	// chunk sort by offset
	this.chunkList.sort(function (a, b) {
	    const ao = a.offset;
	    const bo = b.offset;
	    if (ao < bo) {
		return -1;
	    } else if (ao > bo) {
		return 1;
	    }
	    return 0;
	});
    }

    parseIFD(arr, bo, name) {
	const ifdNameTable = this.getIFDNameTable();
	const infos = [];
	const nTags = this.binary.readUint16(arr, bo);
	const nBytes = 2 + 12 * nTags + 4; // nTags + Tag x 4 + IFD1Pointer
	const chunk = { offset:bo, name:name, bytes:null, infos:null };
	infos.push({ offset:bo, nTags:nTags });
 	let o = bo + 2;
	for (let i = 0; i < nTags; i++) {
	    const tagNo = this.binary.readUint16(arr, o);
	    const tagType = this.binary.readUint16(arr, o + 2);
	    const tagCount = this.binary.readUint32(arr, o + 4);
	    let tagOffset = this.binary.readUint32(arr, o + 8);
            switch (tagType) {
	      case 1: // BYTE
		if (tagCount <= 4) { tagOffset = this.binary.readUint8(arr, o + 8); }
                break;
	      case 3: // SHORT
		if (tagCount <= 2) { tagOffset = this.binary.readUint16(arr, o + 8); }
		break;
	    }
	    infos.push({
offset:o,
tagNo:Utils.ToHex(tagNo),
tagType:tagType,
			tagCount:tagCount,
tagOffset:tagOffset
});
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
        let iccProfileData = null; let iccProfileSize;
        for (const idx in this.chunkList) {
	    const chunk = this.chunkList[idx];
            if (chunk.name === '0thIFD') {
                const infos = chunk.infos;
                for (const idxInfo in infos) {
                    const info = infos[idxInfo];
                    console.log(info, info.tagNo);
                    if (info.tagNo == 8773) { // XXX
                        const byteOffset = info.tagOffset;
                        console.log(byteOffset);
                        iccProfileData = this.data.subarray(info.tagOffset,
                                                            info.tagOffset +
                                                            info.tagCount);
                        iccProfileSize = info.tagCount;
	                const iccProfileArr = new Uint8Array(iccProfileSize);
                        iccProfileArr.set(iccProfileData, 0);
                        return iccProfileArr;
                   }
                }
            }
        }
        return null;
    }
}
