"use strict";

/*
  2018/02/19- yoya@awm.jp
  ref)
  - http://www.color.org/icc32.pdf
  - https://github.com/yoya/IO_ICC
*/


class ICCBinary extends Binary {
    getDateTime() {
	return {
	    'Year':    this.getUint16(),
	    'Month':   this.getUint16(),
	    'Day':     this.getUint16(),
	    'Hours':   this.getUint16(),
	    'Minutes': this.getUint16(),
	    'Seconds': this.getUint16(),
	    toString:function() {
		var year    = Utils.LeftPad(this["Year"],   4, "0");
		var month   = Utils.LeftPad(this["Month"],  2, "0");
		var day     = Utils.LeftPad(this["Day"],    2, "0");
		var hours   = Utils.LeftPad(this["Hours"],  2, "0");
		var minutes = Utils.LeftPad(this["Minutes"],2, "0");
		var seconds = Utils.LeftPad(this["Seconds"],2, "0");
		return year+"/"+month+"/"+day+" "+hours+":"+minutes+":"+seconds;
	    }
	};
    }
    getXYZ() {
	return {
	    'X':this.getS15Fixed16(),
	    'Y':this.getS15Fixed16(),
	    'Z':this.getS15Fixed16(),
	    toString:function() {
		return Math.round(this["X"]*1000)/1000+","+
		    Math.round(this["Y"]*1000)/1000+","+
		    Math.round(this["Z"]*1000)/1000;
	    }

	};
    }
    getS15Fixed16() {
	return this.getSint32() / 0x10000; // BigEndian ???
    }
}
    
class IO_ICC {
    constructor() {
    }
    static signature() {
	return []; //
    }
    static verifySig(arr) {
	var binary = new ICCBinary("BigEndian", arr);
	var profileSize = binary.getUint32(arr);
	if (profileSize !== arr.length) {
	    return false;
	}
	// Device class check 'scnr', 'mntr', 'prtr'
	// Connection Color Space check 'XYZ ', 'Lab '
	return true;
    }
    parse(arr) {
	// this.arr = arr;
	var header = {};
	var tagTable = [];
	var arrLen = arr.length;
	var binary = new ICCBinary("BigEndian", arr);
	header['ProfileSize'] = binary.getUint32();
	header['CMMType'] = binary.getText(4);
	header['ProfileVersion'] = {
	    'Major':binary.getUIBCD8(),
	    'Minor':binary.getUIBCD8(),
	    toString:function() {
		return this['Major']+'.'+this['Minor'];
	    }
	};
	binary.getUint16(); // profile version reserved
	header['ProfileDeviceClass'] = binary.getText(4);
	header['ColorSpace'] = binary.getText(4);
	header['ConnectionSpace'] = binary.getText(4);
	header['DataTimeCreated'] = binary.getDateTime();
	header['AcspSignature'] = binary.getText(4);
	header['PrimaryPlatform'] = binary.getText(4);
	header['CMMOptions'] = {
	    'CMMOptions':binary.getUint32(),
	    toString:function() {
		return "0x"+Utils.ToHex(this['CMMOptions'], 8);
	    }
	};
	header['DeviceManufacturer'] = binary.getText(4);
        header['DeviceModel'] = binary.getUint32();
        header['DeviceAttribute'] = {
	    'DeviceAttribute':binary.getUint64(),
	    toString:function() {
		return "0x"+Utils.ToHex(this['DeviceAttribute'], 16);
	    }
	};
        header['RenderingIntent'] = {
	    'RenderingIntent':binary.getUint32(),
	    toString:function() {
		var intent = this['RenderingIntent'];
		var text = ['Perceptual',
			    'Media-relative colorimetric',
			    'Saturation',
			    'ICC-absolute colorimetric'][intent];
		return intent+" ("+text+")";
	    }
	}
        header['XYZvalueD50'] = binary.getXYZ();
        header['CreatorID'] = binary.getText(4);
	this.header = header;
	//
	binary.setCursol(128); // 128: HeaderSize
	var tagTableCount = binary.getUint32();
	for (var i = 0 ; i < tagTableCount ; i++) {
	    var tag = { 'Signature':binary.getText(4),
			'Offset':binary.getUint32(),
			'Size':binary.getUint32() };
	    tag['Type'] = binary.readText(arr, tag['Offset'], 4);
	    tag['arr'] = arr;
	    tagTable.push(tag);
	}
	this.tagTable = tagTable;
	//
	return true;
    }
    getHeader() {
	return this.header;
    }
    getTagTable() {
	return this.tagTable;
    }
    getTagDetail(tag) {
	switch (tag['Type']) {
	case "desc":
	    return this.getTagDetailDesc(tag);
	case "text":
	    return this.getTagDetailText(tag);
	case "XYZ ":
	    return this.getTagDetailXYZ(tag);
	}
	return null;
    }
    getTagDetailDesc(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	if (type !== 'desc') {
	    console.log("type is not desc:"+type);
	    return null;
	}
	binary.getSubArray(4); // skip
	var asciiCount = binary.getUint32();
	if (asciiCount > 0) {
	    tagDetail['Ascii'] = binary.getText(asciiCount);
	}
	tagDetail['UnicodeLanguage'] = binary.getText(4);
	var unicodeCount = binary.getUint32();
	if (unicodeCount > 0) {
	    var ucs2be = binary.getSubArray(unicodeCount * 2);
	    var decoder = new TextDecoder("utf-16be");
	    tagDetail['Unicode'] = decoder.decode(ucs2be);
	}
	tagDetail['ScriptCode'] = binary.getUint16();
	var macintoshCount = binary.getUint8();
	if (macintoshCount > 0) {
	    tagDetail['Macintosh'] = binary.getText(macintoshCount);
	}
	return tagDetail;
    }
    getTagDetailText(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	if (type !== 'text') {
	    console.log("type is not text:"+type);
	    return {};
	}
	binary.getSubArray(4); // skip
	tagDetail['Text'] = binary.getText(size - 8);
	return tagDetail;
    }
    getTagDetailXYZ(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	if (type !== 'XYZ ') {
	    console.log("type is not XYZ :"+type);
	    return {};
	}
	binary.getSubArray(4); // skip
	tagDetail['XYZ'] = binary.getXYZ();
	return tagDetail;
    }
    build() {
	;
    }
}
