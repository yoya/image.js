"use strict";

/*
  2020/02/19- yoya@awm.jp
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    var containerNode = document.getElementById("ibv_container");
    dropFunction(document, function(buf) {
        var arr = new Uint8Array(buf);
        let gif = new IO_GIF();
        gif.parse(arr);
        let chunkList = gif.getChunkList();
        for (let chunk of chunkList) {
            if (chunk.name == "Image") {
                // console.debug(chunk);
                let bytes = chunk.bytes;
                let width  = bytes[6]*0x100 + bytes[5];
                let height = bytes[8]*0x100 + bytes[7];
                let flags =  bytes[9];
                let offset = 10;
                if (flags & 0x80) { // local color table flgas
                    let tableSize = pow(2, (flags&0x3) + 1);
                    offset += 3 * tableSize;
                }
                let lzwCodeSize = bytes[offset++];
                let blockSize = bytes[offset++];
                // console.debug(width, height);
                var indices = new Uint8Array(width * height);
                var blockArr = [];
                var blockTotalSize = blockSize;
                while (blockSize > 0) {
                    let block = bytes.subarray(offset, offset + blockSize);
                    blockArr.push(block);
                    offset += blockSize;
                    blockSize = bytes[offset++];
                    blockTotalSize += blockSize;
                }
                var blockData = new Uint8Array(blockTotalSize);
                var k = 0;
                for (let i = 0, n = blockArr.length ; i < n ; i++) {
                    let block = blockArr[i];
                    for (let j = 0, m = block.length ; j < m ; j++) {
                        blockData[k++] = block[j];
                    }
                }
                lzw_decode(blockData, lzwCodeSize, indices);
                console.log(indices);
            }
        }
    }, "ArrayBuffer");
}

class lzw_bitreader {
    constructor(lzwData) {
        this._data = lzwData;
        this._byteOffset = 0;
        this._bitOffset= 0;
        this.codeMasks = new Uint16Array(13);
        this.codeMasks.set([ 0x0000, 0x0001, 0x0003, 0x0007,
                             0x000f, 0x001f, 0x003f, 0x007f,
                             0x00ff, 0x01ff, 0x03ff, 0x07ff,
                             0x0fff ]);
    }
    readBits(codeBits) {
        let val = 0, valBits = codeBits;
        let shiftBits2 = 0;
        while (valBits > 0) {
            let remainBits = 8 - this._bitOffset;
            let shiftBits = (remainBits > valBits)? valBits: remainBits;
            val += ((this._data[this._byteOffset] >> this._bitOffset) & this.codeMasks[shiftBits]) << shiftBits2;
            this._bitOffset += shiftBits;
            if (this._bitOffset >= 8) {
                this._byteOffset++;
                this._bitOffset -= 8;
            }
            valBits -= shiftBits;
            shiftBits2 += shiftBits;
        }
        return val;
    }
}

function lzw_decode(LZWcode, codeBits, indices) {
    let reader = new lzw_bitreader(LZWcode);
    let indicesSize = LZWcode.length;
    let clearCode = 2 ** codeBits;
    let endCode   = clearCode + 1;
    let nextCode  = endCode   + 1;
    let dictionarySize = clearCode * 2;
    let LZWcodeSize = LZWcode.length;
    console.log("CodeBits:"+codeBits+" ClearCode:"+clearCode+" EndCode:"+endCode+" LZWcodeSize:"+LZWcodeSize+" IndicesSize:"+indicesSize);
    let finish = false;
    let indicesProgress = 0;
    let w = null;
    let dictionaryTable = null;
    for (let i = 0; i < LZWcodeSize; i++) {
        let code = reader.readBits(codeBits+1);
        let output;
        if (code === clearCode) {
            console.log("=====  ClearCode");
            dictionaryTable = [];
            for (let j = 0; j < clearCode; j++) {
                dictionaryTable.push([j]);
            }
            dictionaryTable.push(null); // ClearCode
            dictionaryTable.push(null); // EndCode
            output = [];
        } else if (code === endCode) {
            console.log("===== EndCode");
            finish = true;
            output = [];
        } else {
            if (dictionaryTable[code]) {
                output = dictionaryTable[code];
            } else {
                output = w.concat([w[0]]);
            }
            if (w !== null) {
                dictionaryTable.push(w.concat([output[0]]));
            }
            w = output;
        }
        console.log("["+i+"] code:"+code+"(bits:"+(codeBits+1));
        if (code === clearCode) {
            console.log("clearCode>");
        } else if (code === endCode) {
            console.log(" <endCode>");
        } else {
            var text = "["+indicesProgress+"]";
            for (let c of output) {
                text += " "+ c;
                indices[indicesProgress++] = c;
            }
            console.log(text);
        }
        if ((2 ** (codeBits+1)) <= dictionaryTable.length) {
            codeBits++;
        }
        if ((indicesProgress >= indicesSize) || finish) {
            return ;
        }
    }
}
