"use strict";

/*
  2017/01/06- yoya@awm.jp
  ref)
  - https://www.w3.org/TR/PNG/
  - http://www.libpng.org/pub/png/spec/
*/

class IO_PNG {
    constructor() {
	this.binary = new Binary("BigEndian");
    }
    static signature() { // "\x89PNG\r\n^Z\n"
	return [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    }
    static verifySig(arr) {
	var sig = this.signature();
	if (arr.length < sig.length) {
	    return false; // too short
	}
	for (var i = 0, n = sig.length ; i < n ; i++) {
	    if (arr[i] !== sig[i]) {
		return false; // different value found
	    }
	}
	return true; // completely matching
    }
    parse(arr) {
	this.data = arr;
	var signature = arr.subarray(0, 8);
	var chunk = {name:"Signature", offset:0, bytes:signature,
		     infos:[{offset:0, signature:Utils.ToText(signature)}]};
	var chunkList = [chunk];
	var arrLen = arr.length;
	var bo = 8; //bo: byteOffset(& baseOffset);
	var bytes;
	while (bo < arrLen) {
	    var len = this.binary.readUint32(arr, bo);
	    var type = Utils.ToText(arr.subarray(bo + 4, bo + 8));
	    var chunk = {name:type, offset:bo, bytes:null, crc32:null, infos:null};
	    var infos = [{offset:bo, len:len}];
	    infos.push({offset:bo+4, type:type});
	    var o = bo + 8;
	    if (0 < len) {
		switch (type) {
		case "IHDR":
		    var width = this.binary.readUint32(arr, o);
		    var height = this.binary.readUint32(arr, o+4);
		    var bitDepth = arr[o+8];
		    var colourType = arr[o+9];
		    var compressionMethod = arr[o+10];
		    var filterMethod = arr[o+11];
		    var interlaceMethod = arr[o+12];
		    infos.push({offset:o, width:width});
		    infos.push({offset:o+4, height:height});
		    infos.push({offset:o+8, bitDepth:bitDepth});
		    infos.push({offset:o+9, colourType:colourType});
		    infos.push({offset:o+10, compressionMethod:compressionMethod});
		    infos.push({offset:o+11, filterMethod:filterMethod});
		    infos.push({offset:o+12, interlaceMethod:interlaceMethod});
		    break;
		default:
		    infos.push({offset:o, nBytes:len});
		    break;
		}

	    }
	    o = bo + 8 + len;
	    var crc32  = this.binary.readUint32(arr, o);
	    chunk.crc32 = crc32;
	    infos.push({offset:o, crc32:crc32});
	    o += 4;
	    bytes = arr.subarray(bo, o);
	    bo = o;
	    chunk.bytes = bytes;
	    chunk.infos = infos;
	    chunkList.push(chunk);
	    if (type  === "IEND") {
		break;
	    }
	}
	this.chunkList = chunkList;
	return 
    }
    getChunkList() {
	return this.chunkList;
    }
    build() {
        let arrArr = [];
        for (var idx in this.chunkList) {
            arrArr.push(this.chunkList[idx].bytes);
        }
        return Utils.joinArray(arrArr);
    }
    getIHDRchunk() {
        for (var idx in this.chunkList) {
            var chunk = this.chunkList[idx];
            if (chunk.name === "IHDR") {
                return chunk;
            }
        }
    }
    getNCompByColourType(colourType) {
        return [
            1,  // 0: Gray;
            0,
            3,  // 2: RGB (RGB24)
            1,  // 3: PALETTE
            2,  // 4: GRAY_ALPHA
            0,
            4   // 6: RGB_ALPHA (RGB32)
        ] [colourType];
    }
    getImageStride() {
        const ihdrChunk = this.getIHDRchunk();
        const infos      = ihdrChunk.infos;
        const width      = infos[2].width;
        const bitDepth   = infos[4].bitDepth;
        const ncomp = this.getNComp();
        const stride = 1 + Math.ceil(width * ncomp * bitDepth / 8)
        return stride | 0;
    }
    getImageHeight() {
        const ihdrChunk = this.getIHDRchunk();
        return ihdrChunk.infos[3].height;
    }
    getNComp() {
        const ihdrChunk = this.getIHDRchunk();
        const colourType = ihdrChunk.infos[5].colourType;
        return this.getNCompByColourType(colourType);
    }
    getIDATdata() {
        let arrArr = [];
        for (var idx in this.chunkList) {
            var chunk = this.chunkList[idx];
            if (chunk.name === "IDAT") {
                arrArr.push(chunk.bytes.subarray(8, -4));
            }
        }
        return Utils.joinArray(arrArr);
    }
    addIDATdata(arr) {
        let dataLen = arr.length;
        let nBytes = 4 + 4 + dataLen + 4;
        let bytes = new Uint8Array(nBytes);
        bytes[0] = dataLen >> 24;
        bytes[1] = dataLen >> 16;
        bytes[2] = dataLen >>  8;
        bytes[3] = dataLen >>  0;
        bytes[4] = 0x49;  // I
        bytes[5] = 0x44;  // D
        bytes[6] = 0x41;  // A
        bytes[7] = 0x54;  // T
        for (let i = 0, j = 8 ; i < dataLen ; i++, j++) {
            bytes[j] = arr[i];
        }
        let crc32 = 0;
        var chunk = {name:"IDAT", offset:null, bytes:bytes, crc32:crc32, infos:null};
        console.debug(this.chunkList);
        this.chunkList.splice(-1 , 0, chunk);
    }
    deleteChunk(name) {
        for (var idx in this.chunkList) {
            if (this.chunkList[idx].name === name) {
                delete this.chunkList[idx];
            }
        }
        // index renumbering ???
    }
    getICC() {
	for (var idx in this.chunkList) {
	    var chunk = this.chunkList[idx];
	    if (chunk.name === "iCCP") {
		var bytes = chunk.bytes;
		var offset = 8;
		while (bytes[offset++] !== 0); // profile name (zero terminate)
		var method = bytes[offset++];  // compression method
		if (method !== 0) {
		    console.error("compression method must be deflate method:"+method);
		    return null;
		}
		// https://github.com/imaya/zlib.js
		var compressed = bytes.subarray(offset);
		var inflate = new Zlib.Inflate(compressed);
		return inflate.decompress();
	    }
	}
	return null;
    }
}
