'use strict';

/*
  2018/02/19- yoya@awm.jp
  ref)
  - http://www.color.org/icc32.pdf
  - https://github.com/yoya/IO_ICC
*/

import { Binary } from './binary';

export class ICCBinary extends Binary {
    getDateTime() {
	return {
	    'Year':    this.getUint16(),
	    'Month':   this.getUint16(),
	    'Day':     this.getUint16(),
	    'Hours':   this.getUint16(),
	    'Minutes': this.getUint16(),
	    'Seconds': this.getUint16(),
	    toString:function() {
		const year    = Utils.LeftPad(this.Year,   4, '0');
		const month   = Utils.LeftPad(this.Month,  2, '0');
		const day     = Utils.LeftPad(this.Day,    2, '0');
		const hours   = Utils.LeftPad(this.Hours,  2, '0');
		const minutes = Utils.LeftPad(this.Minutes, 2, '0');
		const seconds = Utils.LeftPad(this.Seconds, 2, '0');
		return year + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds;
	    }
	};
    }

    getXYZ() {
	return {
	    'X':this.getS15Fixed16(),
	    'Y':this.getS15Fixed16(),
	    'Z':this.getS15Fixed16(),
	    toString:function() {
		return Math.round(this.X * 1000) / 1000 + ',' +
		    Math.round(this.Y * 1000) / 1000 + ',' +
		    Math.round(this.Z * 1000) / 1000;
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
	const binary = new ICCBinary('BigEndian', arr);
	const profileSize = binary.getUint32();
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
	const acspSignature = binary.getText(4);
	if (acspSignature !== 'acsp') {
	    console.debug('acspSignature:' + acspSignature + ' !== \'acsp\'');
	    return false;
	}
	return true;
    }

    parse(arr) {
	this.arr = arr;
	const header = {};
	const tagTable = [];
	const arrLen = arr.length;
	const binary = new ICCBinary('BigEndian', arr);
	const profileSize = binary.getUint32();
	header.ProfileSize = profileSize;
	if (arrLen < profileSize) {
	    console.warn('arrLen:' + arrLen + ' < profileSize:' + profileSize);
	    return;
	}
	header.CMMType = binary.getText(4);
	header.ProfileVersion = {
	    'Major':binary.getUIBCD8(),
	    'Minor':binary.getUIBCD8(),
	    toString:function() {
		return this.Major + '.' + this.Minor;
	    }
	};
	binary.getUint16(); // profile version reserved
	header.ProfileDeviceClass = binary.getText(4);
	header.ColorSpace = binary.getText(4);
	header.ConnectionSpace = binary.getText(4);
	header.DataTimeCreated = binary.getDateTime();
	header.AcspSignature = binary.getText(4);
	header.PrimaryPlatform = binary.getText(4);
	header.CMMOptions = {
	    'CMMOptions':binary.getUint32(),
	    toString:function() {
		return '0x' + Utils.ToHex(this.CMMOptions, 8);
	    }
	};
	header.DeviceManufacturer = binary.getText(4);
        header.DeviceModel = binary.getUint32();
        header.DeviceAttribute = {
	    'DeviceAttribute':binary.getUint64(),
	    toString:function() {
		return '0x' + Utils.ToHex(this.DeviceAttribute, 16);
	    }
	};
        header.RenderingIntent = {
	    'RenderingIntent':binary.getUint32(),
	    toString:function() {
		const intent = this.RenderingIntent;
		const text = ['Perceptual',
			    'Media-relative colorimetric',
			    'Saturation',
			    'ICC-absolute colorimetric'][intent];
		return intent + ' (' + text + ')';
	    }
	};
        header.XYZvalueD50 = binary.getXYZ();
        header.CreatorID = binary.getText(4);
	this.header = header;
	//
	binary.setCursol(128); // 128: HeaderSize
	const tagTableCount = binary.getUint32();
	if (tagTableCount > 100) {
	    console.warn('tagTableCount:' + tagTableCount + ' too large');
	    return 0;
	}
	for (let i = 0; i < tagTableCount; i++) {
	    const tag = {
 'Signature':binary.getText(4),
			'Offset':binary.getUint32(),
			'Size':binary.getUint32()
};
	    tag.Type = binary.readText(arr, tag.Offset, 4);
	    tag.arr = arr;
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
	const tagTable = this.tagTable;
	for (const idx in tagTable) {
	    const tag = tagTable[idx];
	    if (tag.Signature === sig) {
		return tag;
	    }
	}
	return null;
    }

    getTagDetail(tag) {
	switch (tag.Type) {
	case 'desc':
	    return this.getTagDetailDesc(tag);
	case 'text':
	    return this.getTagDetailText(tag);
	case 'mluc':
	    return this.getTagDetailMLUC(tag);
	case 'sig ':
	    return this.getTagDetailSig(tag);
	case 'XYZ ':
	    return this.getTagDetailXYZ(tag);
	case 'curv':
	    return this.getTagDetailCurv(tag);
	case 'para':
	    return this.getTagDetailPara(tag);
	case 'sf32':
	    return this.getTagDetailSF32(tag);
	case 'mft1':
	case 'mft2':
	    return this.getTagDetailMFT(tag);
	case 'mmod':
	    return this.getTagDetailMmod(tag);
	}
	return null;
    }

    getTagDetailDesc(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	const asciiCount = binary.getUint32();
	if (asciiCount > 0) {
	    tagDetail.Ascii = binary.getText(asciiCount);
	}
	tagDetail.UnicodeLanguage = binary.getText(4);
	const unicodeCount = binary.getUint32();
	if (unicodeCount > 0) {
	    const ucs2be = binary.getSubArray(unicodeCount * 2);
	    const decoder = new TextDecoder('utf-16be');
	    tagDetail.Unicode = decoder.decode(ucs2be);
	}
	tagDetail.ScriptCode = binary.getUint16();
	const macintoshCount = binary.getUint8();
	if (macintoshCount > 0) {
	    tagDetail.Macintosh = binary.getText(macintoshCount);
	}
	return tagDetail;
    }

    getTagDetailText(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	tagDetail.Text = binary.getText(size - 8);
	return tagDetail;
    }

    getTagDetailMLUC(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	const recordNum = binary.getUint32();
	const recordSize = binary.getUint32();
	tagDetail.RecordNum = recordNum;
	tagDetail.RecordSize = recordSize;
	const records = {};
	for (let i = 0; i < recordNum; i++) {
	    const langCode = binary.getText(2);
	    const countryCode = binary.getText(2);
	    const recSize = binary.getUint32();
	    const recOffset = binary.getUint32();
	    const record = {
'LangCode':langCode,
			  'CountryCode':countryCode,
			  'Size':recSize,
			  'Offset':recOffset
};
	    const ucs2be = binary.readSubArray(arr, offset + recOffset, recSize);
	    const decoder = new TextDecoder('utf-16be');
	    record.String = decoder.decode(ucs2be);
	    records[i] = record;
	}
	records.toString = function() {
	    const n = this.length;
	    const s = [];
	    for (const i in this) {
		if (i === 'toString') {
		    continue;
		}
		const record = this[i];
		s.push(record.LangCode + '_' + record.CountryCode + ':' + record.String);
	    }
	    return s.join(', ');
	};
	tagDetail.Records = records;
	return tagDetail;
    }

    getTagDetailSig(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	tagDetail.Signature = binary.getText(size - 8);
	return tagDetail;
    }

    getTagDetailXYZ(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	tagDetail.XYZ = binary.getXYZ();
	return tagDetail;
    }

    getTagDetailCurv(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	const count = binary.getUint32();
	tagDetail.Count = count;
	if (count === 1) {
	    tagDetail.Gamma = binary.getUint16() / 0x100;
	} else {
	    const values = new Uint16Array(count);
	    for (let i = 0; i < count; i++) {
		values[i] = binary.getUint16();
	    }
	    tagDetail.Values = values;
	}
	return tagDetail;
    }

    getTagDetailPara(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	const functionType = binary.getUint16();
	tagDetail.FunctionType = functionType;
	binary.getSubArray(2); // reserved
	const count = [1, 3, 4, 5, 7][functionType];
	tagDetail.Count = count;
	const values = new Float32Array(count);
	for (let i = 0; i < count; i++) {
	    const v = binary.getSint32();
	    values[i] = v / 0x10000;
	}
	tagDetail.Values = values;
	return tagDetail;
    }

    getTagDetailSF32(tag) {
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	const count = (size - 4 - 4) / 4;
	const values = new Float32Array(count);
	for (let i = 0; i < count; i++) {
	    const v = binary.getSint32() / 0x10000;
	}
	tagDetail.Values = values;
	return tagDetail;
    }

    getTagDetailMFT(tag) { // mft1 or mft2
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
	const type = binary.getText(4);
	binary.getSubArray(4); // reserved
	const nInput = binary.getUint8();
        const nOutput = binary.getUint8();
	const nCLUTGridPoints = binary.getUint8();
	tagDetail.nInput = nInput;
	tagDetail.nOutput = nOutput;
	tagDetail.nCLUTGridPoints = nCLUTGridPoints;
	binary.getUint8(); // reserved
	const matrix = new Float32Array(9);
	for (var i = 0; i < 9; i++) {
            matrix[i] = binary.getSint32() / 0x10000;
        }
        tagDetail.Matrix = matrix;
	if (type === 'mft1') {
	    var nInputTableEntries  = 256;
            var nOutputTableEntries = 256;
	} else {
	    var nInputTableEntries  = binary.getUint16();
            var nOutputTableEntries = binary.getUint16();
	}
	tagDetail.nInputTableEntries  = nInputTableEntries;
	tagDetail.nOutputTableEntries = nOutputTableEntries;
	const nInputTable = nInput * nInputTableEntries;
	if (type === 'mft1') {
	    var inputTable = new Uint8Array(nInputTable);
	    for (var i = 0; i < nInputTable; i++) {
		inputTable[i] = binary.getUint8();
	    }
	} else {
	    var inputTable = new Uint16Array(nInputTable);
	    for (var i = 0; i < nInputTable; i++) {
		inputTable[i] = binary.getUint16();
	    }
	}
	tagDetail.InputTable = inputTable;
	const nCLUTPoints = Math.pow(nCLUTGridPoints, nInput) * nOutput;
	if (type === 'mft1') {
	    var clutTable =  new Uint8Array(nCLUTPoints);
	    for (var i = 0; i < nCLUTPoints; i++) {
		clutTable[i] = binary.getUint8();
	    }
	} else {
	    var clutTable =  new Uint16Array(nCLUTPoints);
	    for (var i = 0; i < nCLUTPoints; i++) {
		clutTable[i] = binary.getUint16();
	    }
	}
	tagDetail.CLUTTable = clutTable;
	const nOutputTable = nOutput * nOutputTableEntries;
	if (type === 'mft1') {
	    var outputTable = new Uint8Array(nOutputTable);
	    for (var i = 0; i < nOutputTable; i++) {
		outputTable[i] = binary.getUint8();
	    }
	} else {
	    var outputTable = new Uint16Array(nOutputTable);
	    for (var i = 0; i < nOutputTable; i++) {
		outputTable[i] = binary.getUint16();
	    }
	}
	tagDetail.OutputTable = outputTable;
	return tagDetail;
    }

    getTagDetailMmod(tag) { // XXX
	const tagDetail = {};
	const arr = tag.arr;
	const offset = tag.Offset;
	const size = tag.Size;
	const binary = new ICCBinary('BigEndian', arr.subarray(offset, offset + size));
         // XXX
    }

    build() {

    }

    getICC() {
	return this.arr;
    }
}
