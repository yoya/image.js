"use strict";

/*
  2017/01/06- yoya@awm.jp
  ref)
  - https://www.w3.org/Graphics/GIF/spec-gif89a.txt
*/


class IO_GIF {
    constructor() {
	this.binary = new Binary("LittleEndian");
    }
    static signature() {
	return [0x47, 0x49, 0x46]; // "GIF"
    }
    separatorName(separator) {
	var separatorTable = {
	    0x21:'Extension',
	    0x2C:'Image',
	    0x3B:'Trailer'
	};
	if (separator in separatorTable) {
	    return separatorTable[separator];
	}
	return "(unknown)";
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
	var sigArr = arr.subarray(0, 3);
	var signature = Utils.ToText(sigArr);
	var chunk = {name:"Signature", offset:0, bytes:sigArr,
		     infos:[{offset:0, signature:signature}]
		    };
	var chunkList = [chunk];
	var arrLen = arr.length;
	var versionArr = arr.subarray(3, 6);
	var version = Utils.ToText(versionArr);
	chunkList.push({name:"Version", offset:3, bytes:versionArr,
			 infos:[{offset:3, version:version}]});
	// Logical Screen
	var sWidth  = arr[6] + 0x100*arr[7];
	var sHeight = arr[8] + 0x100*arr[9];
	chunkList.push({name:"LogicalScreen",
			 offset:6, bytes:arr.subarray(6, 10),
			 infos:[{offset:6, width:sWidth},
				{offset:8, height:sHeight}]});
	var tmp = arr[10];
	var globalColorTableFlag   = (tmp >>> 7) & 0x1;
	var colorResolution        = (tmp >>> 4) & 0x7;
	var sortFlag               = (tmp >>> 3) & 0x1;
	var sizeOfGlobalColorTable = (tmp >>> 0) & 0x7;
	colorResolution = colorResolution + 1,
	sizeOfGlobalColorTable = Math.pow(2, sizeOfGlobalColorTable+1);
	var backgroundColorIndex = arr[11];
	var pixelAspectRatio = arr[12];
	chunkList.push({name:"GlobalDesripctor", offset:10, bytes:arr.subarray(10, 13),
			 infos:[{offset:10,
				 globalColorTableFlag:globalColorTableFlag,
				 colorResolution:colorResolution,
				 sortFlag:sortFlag,
				 sizeOfGlobalColorTable:sizeOfGlobalColorTable},
				{offset:11, backgroundColorIndex:backgroundColorIndex},
				{offset:12, pixelAspectRatio:pixelAspectRatio}]
			});
	var bo = 13;
	var o = bo;
	if (globalColorTableFlag) {
	    var globalColorTable = [];
	    for (var i = 0 ; i < sizeOfGlobalColorTable ; i++) {
		var subArray = arr.subarray(o, o+3);
		var hexColor = "#"+Utils.ToHexArray(subArray).join("");
		globalColorTable.push(hexColor);
		o += 3;
	    }
	    chunk = {name:"GlobalColorTable", offset:bo,
		     bytes:arr.subarray(bo, o),
		     infos:[{offset:bo,
			     globalColorTable:globalColorTable}]};
	    chunkList.push(chunk);
	    bo = o;
	}
	var trail = false;
	while ((bo < arrLen) && (trail === false)) {
	    var separator = arr[bo];
	    var name = this.separatorName(separator);
	    chunk = {name:name, offset:bo, bytes:null, infos:null};
	    var infos = [{offset:bo, separator:separator}];
	    switch (separator) {
	    case 0x3B:  // Trailer (End of GIF Data Stream)
		o = bo + 1;
		trail = true;
		break;
	    case 0x21: // Extension Separator
		var extensionBlockLabel = arr[bo + 1];
		var extensionDataSize =  arr[bo + 2];
		infos.push({offset:bo + 1,
			    extensionBlockLabel:extensionBlockLabel});
		infos.push({offset:bo + 2,
			    extensionDataSize:extensionDataSize});
		if (extensionDataSize === 0) {
		    break; // no data
		}
		o = bo + 3;
		switch (extensionBlockLabel) {
		case 0xF9: // Graphics Control
		    var tmp = arr[o];
		    var disposalMethod      = (tmp >>> 2) & 0x3;
		    var userInputFlag       = (tmp >>> 1) & 0x1;
		    var transprentColorFlag = (tmp >>> 0) & 0x1;
		    var delayTime =  this.binary.readUint16(arr, o+1);
		    var transparentColorIndex = arr[o+3];
		    infos.push({offset:o,
				disposalMethod:disposalMethod,
				userInputFlag:userInputFlag,
				transprentColorFlag},
			       {offset:o+1, delayTime:delayTime},
			       {offset:o+3, transparentColorIndex});
		    break;
		case 0xFE: // Comment Extension
		    var commentData = Utils.ToText(arr.subarray(o, o + extensionDataSize));
		    break;
		case 0xFF: // Application Extension
		    var applicationIdentifier = Utils.ToText(arr.subarray(o, o + 8))
		    var applicationAuthenticationCode = Utils.ToText(arr.subarray(o + 8, o + 11));
		    infos.push({offset:o,
				applicationIdentifier:applicationIdentifier},
			       {offset:o+8,
				applicationAuthenticationCode:applicationAuthenticationCode});
		    break;
		default:
		    console.error("unknown extension block label:"+extensionBlockLabel);
		    break;
		}
		o += extensionDataSize;
		if (extensionBlockLabel === 0xFF) { // Application Extension
		    var aoffset = o;
		    var applicationData = [];
		    while (true) {
			var blockSize = arr[o];
			infos.push({offset:o, applicationDataBlockSize:blockSize});
			if (blockSize === 0) {
			    break;
			}
			o += 1;
			infos.push({offset:o, nBytes:blockSize});
			o += blockSize;
		    }

		}
		var extensionBlockTrailer = arr[o];
		infos.push({offset:o,
			    extensionBlockTrailer});
		o += 1;
	        break;
	    case 0x2C: // Image Separator
		var left   = this.binary.readUint16(arr, bo + 1);
		var top    = this.binary.readUint16(arr, bo + 3);
		var width  = this.binary.readUint16(arr, bo + 5);
		var height = this.binary.readUint16(arr, bo + 7);
		var tmp = arr[bo + 9];
		var localColorTableFlag   = (tmp >>> 7) & 0x1;
		var interlaceFlag         = (tmp >>> 6) & 0x1;
		var sortFlag              = (tmp >>> 5) & 0x1;
		var sizeOfLocalColorTable = (tmp >>> 0) & 0x7;
		sizeOfLocalColorTable = Math.pow(2, sizeOfLocalColorTable+1);
		infos.push({offset:bo+1, left:left},
			   {offset:bo+3, top:top},
			   {offset:bo+5, width:width},
			   {offset:bo+7, height:height},
			   {offset:bo+9,
			    localColorTableFlag:localColorTableFlag,
			    interlaceFlag:interlaceFlag,
			    sortFlag:sortFlag,
			    sizeOfLocalColorTable:sizeOfLocalColorTable});
		o = bo + 10;
		if (localColorTableFlag) {
		    var localColorTable = [];
		    for (var i = 0 ; i < sizeOfLocalColorTable ; i++) {
			var subArray = arr.subarray(o, o+3);
			var hexColor = "#"+Utils.ToHexArray(subArray).join("");
			localColorTable.push(hexColor);
			o += 3;
		    }
		    infos.push({offset:bo+10,
				localColorTable:localColorTable});
		}
		var lzwMinimumCodeSize = arr[o];
		infos.push({offset:o, lzwMinimumCodeSize:lzwMinimumCodeSize});
		o += 1;
		var ioffset = o;
		var imageData = [];
		while (true) {
		    var blockSize = arr[o];
		    infos.push({offset:o, imageBlockSize:blockSize});
		    if (blockSize === 0) {
			o += 1;
			break;
		    }
		    o += 1;
		    infos.push({offset:o, nBytes:blockSize});
		    o += blockSize;
		}
		break;
	    default:
		console.error("unknown separator:"+separator);
		trail = true;
		break;
	    }
	    chunk.bytes = arr.subarray(bo, o);
	    chunk.infos = infos;
	    chunkList.push(chunk);
	    bo = o;
	}
	this.chunkList = chunkList;
	return 
    }
    getChunkList() {
	return this.chunkList;
    }
    build() {
	;
    }
}
    
