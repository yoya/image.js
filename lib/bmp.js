"use strict";

/*
  2017/01/14- yoya@awm.jp
  ref)
  - https://msdn.microsoft.com/en-us/library/dd183391(v=vs.85).aspx
*/

class IO_BMP {
    constructor() {
	this.binary = new Binary("LittleEndian");
    }
    static signature() {
	return [0x42, 0x4d]; // "BM"
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
	// https://msdn.microsoft.com/en-us/library/dd183374(VS.85).aspx
	var sigArr = arr.subarray(0, 2);
	var type = Utils.ToText(sigArr);
	var chunk = {name:"Bitmap File Header", offset:0,
		     bytes:arr.subarray(0, 14), infos:null};
	var chunkList = [];
	var bytes = null, infos = [];
	infos.push({offset:0, type:type});
	var size =  this.binary.readUint32(arr, 2);
	infos.push({offset:2, size:size});
	var offBits =  this.binary.readUint32(arr, 10);
	infos.push({offset:10, offBits:offBits});
	chunk.infos = infos;
	chunkList.push(chunk);
	// v4: https://msdn.microsoft.com/en-us/library/dd183380(v=vs.85).aspx
	// v5: https://msdn.microsoft.com/en-us/library/dd183381(v=vs.85).aspx
	var chunk = {name:"Bitmap Info Header (DIB Header)", offset:14,
		     bytes:null, infos:null};
	var bytes = null, infos = [];
	var o = 14;
	var dibHeaderSize =  this.binary.readUint32(arr, o);

	switch (dibHeaderSize) {
	case 12:
	    chunk.name += " BMPv2";
	    break;
	case 40:
	    chunk.name += " BMPv3";
	    break;
	case 108:
	    chunk.name += " BMPv4";
	    break;
	case 124:
	    chunk.name += " BMPv5";
	    break;
	default:
	    chunk.name += " unknown version";
	    break;
	}
	// BMPv2
	infos.push({offset:o, dibHeaderSize:dibHeaderSize});
	o += 4;
	infos.push({offset:o, width:this.binary.readSint32(arr, o)});
	o += 4;
	infos.push({offset:o, height:this.binary.readSint32(arr, o)});
	o += 4;

	// BMPv3
	if (dibHeaderSize > 12) {
	    infos.push({offset:o, planes:this.binary.readUint16(arr, o)});
	    o += 2;
	    infos.push({offset:o, bitCount:this.binary.readUint16(arr, o)});
	    o += 2;
	    infos.push({offset:o, compression:this.binary.readUint32(arr, o)});
	    o += 4;
	    infos.push({offset:o, sizeImage:this.binary.readUint32(arr, o)});
	    o += 4;
	    infos.push({offset:o, xPixelsPerMeter:this.binary.readUint32(arr, o)});
	    o += 4;
	    infos.push({offset:o, yPixelsPerMeter:this.binary.readUint32(arr, o)});
	    o += 4;
	    infos.push({offset:o, colorsUsed:this.binary.readUint32(arr, o)});
	    o += 4;
	    infos.push({offset:o, colosImportant:this.binary.readUint32(arr, o)});
	    o += 4;
	}
	// BMPv4
	if (dibHeaderSize > 40) {
	    var redMask   = Utils.ToHex(this.binary.readUint32(arr, o),   8);
	    var greenMask = Utils.ToHex(this.binary.readUint32(arr, o+4), 8);
	    var blueMask  = Utils.ToHex(this.binary.readUint32(arr, o+8), 8);
	    var alphaMask = Utils.ToHex(this.binary.readUint32(arr, o+12),8);
	    infos.push({offset:o,    redMask:redMask});
	    infos.push({offset:o+4,  greenMask:greenMask});
	    infos.push({offset:o+8,  blueMask:blueMask});
	    infos.push({offset:o+12, alphaMask:alphaMask});
	    o += 16;
	    var colorSpaceType = this.binary.readUint32(arr, o);
	    var colorSpaceTypeStr = "0x" + Utils.ToHex(colorSpaceType, 8);
	    // https://msdn.microsoft.com/en-us/library/cc250396.aspx
	    switch (colorSpaceType) {
	    case 0x00000000:
		colorSpaceTypeStr += "(CALIBRATED_RGB)";
		break;
	    case 0x73524742:
		colorSpaceTypeStr += "(sRGB)";
		break;
	    case 0x57696E20:
		colorSpaceTypeStr += "(Win )";
		break;
	    case 0x4d424544:
		colorSpaceTypeStr += "(EMBEDED_PROFILE)";
		break;
	    default:
		colorSpaceTypeStr += "(unknown)";
		break;
	    }
	    infos.push({offset:o, colorSpaceType:colorSpaceTypeStr});
	    o += 4;
	    // CIEXYZTRIPLE structure
	    // https://msdn.microsoft.com/en-us/library/dd371833(v=vs.85).aspx
	    infos.push({offset:o,
			cieXRed:this.binary.readFP2Dot30(arr, o),
			cieYRed:this.binary.readFP2Dot30(arr, o+4),
			cieZRed:this.binary.readFP2Dot30(arr, o+8),
		       });
	    o += 12;
	    infos.push({offset:o,
			cieXGreen:this.binary.readFP2Dot30(arr, o),
			cieYGreen:this.binary.readFP2Dot30(arr, o+4),
			cieZGreen:this.binary.readFP2Dot30(arr, o+8),
		       });
	    o += 12;
	    infos.push({offset:o,
			cieXBlue:this.binary.readFP2Dot30(arr, o),
			cieYBlue:this.binary.readFP2Dot30(arr, o+4),
			cieZBlue:this.binary.readFP2Dot30(arr, o+8),
		       });
	    o += 12;
	    var redGamma   = this.binary.readUint32(arr, o);
	    var greenGamma = this.binary.readUint32(arr, o+4);
	    var blueGamma  = this.binary.readUint32(arr, o+8);
	    infos.push({offset:o,    redGamma:(redGamma/0x10000)});
	    infos.push({offset:o+4,  greenGamma:(greenGamma/0x10000)});
	    infos.push({offset:o+8,  blueGamma:(blueGamma/0x10000)});
	    o += 12;
	    var intent   = this.binary.readUint32(arr, o);
	    var profileData = this.binary.readUint32(arr, o+4);
	    var profileSize = this.binary.readUint32(arr, o+8);
	    var reserved  = this.binary.readUint32(arr, o+12);
	    infos.push({offset:o,    intent:intent});
	    infos.push({offset:o+4,  profileData:profileData});
	    infos.push({offset:o+8,  profileSize:profileSize});
	    infos.push({offset:o+12,  reserved:reserved});
	    o += 16;
	}
	chunk.bytes = arr.subarray(14, 14 + dibHeaderSize);
	chunk.infos = infos;
	chunkList.push(chunk);
	//
	this.chunkList = chunkList;
    }
    getChunkList() {
	return this.chunkList;
    }
    build() {
	;
    }
}
