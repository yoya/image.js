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
	var profileSize = binary.getUint32();
	if (arr.length < profileSize) {
	        return false;
        }
	binary.getText(4);    // CMMType
	binary.getUIBCD8(); binary.getUIBCD8(); // ProfileVersion;
	binary.getUint16();   // profile version reserved
	binary.getText(4);    // profileDeviceClass
	binary.getText(4);    // colorSpace
	binary.getText(4);    // connectionSpace
	binary.getDateTime(); // var dataTimeCreated
	var acspSignature = binary.getText(4);
	if (acspSignature !== 'acsp') {
	    console.debug("acspSignature:"+acspSignature+" !== 'acsp'");
	    return false;
	}
	return true;
    }
    parse(arr) {
	this.arr = arr;
	var header = {};
	var tagTable = [];
	var arrLen = arr.length;
	var binary = new ICCBinary("BigEndian", arr);
	var profileSize = binary.getUint32();
	header['ProfileSize'] = profileSize;
	if (arrLen < profileSize) {
	    console.warn("arrLen:"+arrLen+" < profileSize:"+profileSize);
	    return ;
	}
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
	header['DateTimeCreated'] = binary.getDateTime();
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
	if (100 < tagTableCount) {
	    console.warn("tagTableCount:"+tagTableCount+" too large");
	    return 0;
	}
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
    getTagBySignature(sig) {
	var tagTable = this.tagTable;
	for (var idx in tagTable) {
	    var tag = tagTable[idx];
	    if (tag['Signature'] === sig) {
		return tag;
	    }
	}
	return null;
    }
    getTagDetail(tag) {
	switch (tag['Type']) {
	case "desc":
	    return this.getTagDetailDesc(tag);
	case "text":
	    return this.getTagDetailText(tag);
	case "mluc":
	    return this.getTagDetailMLUC(tag);
	case "sig ":
	    return this.getTagDetailSig(tag);
	case "XYZ ":
	    return this.getTagDetailXYZ(tag);
	case "curv":
	    return this.getTagDetailCurv(tag);
	case "para":
	    return this.getTagDetailPara(tag);
	case "sf32":
	    return this.getTagDetailSF32(tag);
	case "mft1":
	case "mft2":
	    return this.getTagDetailMFT(tag);
	case "mmod":
	    return this.getTagDetailMmod(tag);
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
	binary.getSubArray(4); // reserved
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
	binary.getSubArray(4); // reserved
	tagDetail['Text'] = binary.getText(size - 8);
	return tagDetail;
    }
    getTagDetailMLUC(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	binary.getSubArray(4); // reserved
	var recordNum = binary.getUint32();
	var recordSize = binary.getUint32();
	tagDetail['RecordNum'] = recordNum;
	tagDetail['RecordSize'] = recordSize;
	var records = {};
	for (var i = 0 ; i < recordNum ; i++) {
	    var langCode = binary.getText(2);
	    var countryCode = binary.getText(2);
	    var recSize = binary.getUint32();
	    var recOffset = binary.getUint32();
	    var record = {'LangCode':langCode,
			  'CountryCode':countryCode,
			  'Size':recSize,
			  'Offset':recOffset };
	    var ucs2be = binary.readSubArray(arr, offset + recOffset, recSize);
	    var decoder = new TextDecoder("utf-16be");
	    record['String'] = decoder.decode(ucs2be);
	    records[i] = record;
	}
	records.toString = function() {
	    var n = this.length;
	    var s = [];
	    for (var i in this) {
		if (i === "toString") {
		    continue;
		}
		var record = this[i];
		s.push(record['LangCode']+"_"+record['CountryCode']+":"+record['String']);
	    }
	    return s.join(", ");
	}
	tagDetail['Records'] = records;
	return tagDetail;
    }
    getTagDetailSig(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	binary.getSubArray(4); // reserved
	tagDetail['Signature'] = binary.getText(size - 8);
	return tagDetail;
    }
    getTagDetailXYZ(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	binary.getSubArray(4); // reserved
	tagDetail['XYZ'] = binary.getXYZ();
	return tagDetail;
    }
    getTagDetailCurv(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	binary.getSubArray(4); // reserved
	var count = binary.getUint32();
	tagDetail['Count'] = count;
	if (count === 1) {
	    tagDetail['Gamma'] = binary.getUint16() / 0x100;
	} else {
	    var values = new Uint16Array(count);
	    for (var i = 0 ; i < count ; i++) {
		values[i] = binary.getUint16();
	    }
	    tagDetail['Values'] = values;
	}
	return tagDetail;
    }
    getTagDetailPara(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	binary.getSubArray(4); // reserved
	var functionType = binary.getUint16();
	tagDetail['FunctionType'] = functionType;
	binary.getSubArray(2); // reserved
	var count = [1, 3, 4, 5, 7][functionType];
	tagDetail['Count'] = count;
	var values = new Float32Array(count);
	for (var i = 0 ; i < count ; i++) {
	    var v = binary.getSint32() ;
	    values[i] = v / 0x10000;
	}
	tagDetail['Values'] = values;
	return tagDetail;
    }
    getTagDetailSF32(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	binary.getSubArray(4); // reserved
	var count = (size - 4 - 4) / 4;
	var values = new Float32Array(count);
	for (var i = 0 ; i < count ; i++) {
	    var v = binary.getSint32() / 0x10000;
	}
	tagDetail['Values'] = values;
	return tagDetail;
    }
    getTagDetailMFT(tag) { // mft1 or mft2
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	binary.getSubArray(4); // reserved
	var nInput = binary.getUint8();
        var nOutput = binary.getUint8();
	var nCLUTGridPoints = binary.getUint8();
	tagDetail['nInput'] = nInput;
	tagDetail['nOutput'] = nOutput;
	tagDetail['nCLUTGridPoints'] = nCLUTGridPoints;
	binary.getUint8(); // reserved
	var matrix = new Float32Array(9);
	for (var i = 0 ; i < 9 ; i++) {
            matrix[i] = binary.getSint32() / 0x10000;
        }
        tagDetail['Matrix'] = matrix;
	if (type === 'mft1') {
	    var nInputTableEntries  = 256;
            var nOutputTableEntries = 256;
	} else {
	    var nInputTableEntries  = binary.getUint16();
            var nOutputTableEntries = binary.getUint16();
	}
	tagDetail['nInputTableEntries']  = nInputTableEntries;
	tagDetail['nOutputTableEntries'] = nOutputTableEntries;
	var nInputTable = nInput * nInputTableEntries;
	if (type === 'mft1') {
	    var inputTable = new Uint8Array(nInputTable);
	    for (var i = 0 ; i < nInputTable ; i++) {
		inputTable[i] = binary.getUint8();
	    }
	} else {
	    var inputTable = new Uint16Array(nInputTable);
	    for (var i = 0 ; i < nInputTable ; i++) {
		inputTable[i] = binary.getUint16();
	    }
	}
	tagDetail['InputTable'] = inputTable;
	var nCLUTPoints = Math.pow(nCLUTGridPoints, nInput) * nOutput;
	if (type === 'mft1') {
	    var clutTable =  new Uint8Array(nCLUTPoints);
	    for (var i = 0 ; i < nCLUTPoints ; i++) {
		clutTable[i] = binary.getUint8();
	    }
	} else {
	    var clutTable =  new Uint16Array(nCLUTPoints);
	    for (var i = 0 ; i < nCLUTPoints ; i++) {
		clutTable[i] = binary.getUint16();
	    }
	}
	tagDetail['CLUTTable'] = clutTable;
	var nOutputTable = nOutput * nOutputTableEntries;
	if (type === 'mft1') {
	    var outputTable = new Uint8Array(nOutputTable);
	    for (var i = 0 ; i < nOutputTable ; i++) {
		outputTable[i] = binary.getUint8();
	    }
	} else {
	    var outputTable = new Uint16Array(nOutputTable);
	    for (var i = 0 ; i < nOutputTable ; i++) {
		outputTable[i] = binary.getUint16();
	    }
	}
	tagDetail['OutputTable'] = outputTable;
	return tagDetail;
    }
    getTagDetailMmod(tag) { // XXX
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
        ; // XXX
    }
    build() {
	;
    }
    getICC() {
	return this.arr;
    }
}
