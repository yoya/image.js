"use strict";

/*
  2017/01/11- yoya@awm.jp
*/

class Binary {
    constructor(byteOrder, arr) {
	this.setByteOrder(byteOrder);
	this.arr = arr;
	this.cursol = 0;
    }
    setByteOrder(byteOrder) {
	switch(byteOrder) {
	case "MM": case "BigEndian":
	    this.readUint16 = this.readUint16BigEndian;
	    this.readUint32 = this.readUint32BigEndian;
	    break;
	case "II": case "LittleEndian":
	    this.readUint16 = this.readUint16LittleEndian;
	    this.readUint32 = this.readUint32LittleEndian;
	}
    };
    //
    getUint16() {
	var n = this.readUint16(this.arr, this.cursol);
	this.cursol += 2;
	return v;
    }
    getUint32() {
	var n = this.readUint32(this.arr, this.cursol);
	this.cursol += 4;
	return v;
    }
    getSint32() {
	var n = this.readSint32(this.arr, this.cursol);
	this.cursol += 4;
	return v;
    }
    readSint32(arr, offset) {
	var n = this.readUint32(arr, offset);
	return (n < 0x80000000)? n :(n - 0x80000000);
    }
    readFP2Dot30(arr, offset) {
	return this.readUint32(arr, offset) / 0x40000000;
    }
    // Byte Order Processor
    readUint16BigEndian(arr, offset) {
	return arr[offset]*0x100 + arr[offset+1];
    }
    readUint32BigEndian(arr, offset) {
	return ((arr[offset]*0x100 + arr[offset+1])*0x100 + arr[offset+2])*0x100 + arr[offset+3];
    }
    // Little Endian
    readUint16LittleEndian(arr, offset) {
	return arr[offset] + 0x100 * arr[offset+1];
    }
    readUint32LittleEndian(arr, offset) {
	return arr[offset] + 0x100*(arr[offset+1] + 0x100*(arr[offset+2] + 0x100*arr[offset+3]));
    }
}

