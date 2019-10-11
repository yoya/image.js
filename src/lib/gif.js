/*
  2017/01/06- yoya@awm.jp
  ref)
  - https://www.w3.org/Graphics/GIF/spec-gif89a.txt
*/

import { Binary } from './binary';
import { Utils } from './utils';

export class IO_GIF {
    static signature() {
        return [0x47, 0x49, 0x46]; // "GIF"
    }

    static verifySig(arr) {
        const sig = this.signature();

        if (arr.length < sig.length) {
            return false; // too short
        }

        for (let i = 0, n = sig.length; i < n; i++) {
            if (arr[i] !== sig[i]) {
                return false; // different value found
            }
        }

        return true; // completely matching
    }

    constructor() {
        this.binary = new Binary('LittleEndian');
    }

    separatorName(separator) {
        const separatorTable = {
            0x21: 'Extension',
            0x2C: 'Image',
            0x3B: 'Trailer'
        };

        if (separator in separatorTable) {
            return separatorTable[separator];
        }

        return '(unknown)';
    }

    parse(arr) {
        this.data = arr;
        let chunk = null;
        const sigArr = arr.subarray(0, 3);
        const signature = Utils.ToText(sigArr);
        chunk = {
            name: 'Signature',
            offset: 0,
            bytes: sigArr,
            infos: [{ offset: 0, signature }]
        };
        const chunkList = [chunk];
        const arrLen = arr.length;
        const versionArr = arr.subarray(3, 6);
        const version = Utils.ToText(versionArr);
        chunkList.push({
            name: 'Version',
            offset: 3,
            bytes: versionArr,
            infos: [{ offset: 3, version }]
        });
        // Logical Screen
        const sWidth  = arr[6] + 0x100 * arr[7];
        const sHeight = arr[8] + 0x100 * arr[9];
        chunkList.push({
            name: 'LogicalScreen',
            offset: 6,
            bytes: arr.subarray(6, 10),
            infos: [
                { offset: 6, width: sWidth },
                { offset: 8, height: sHeight }
            ]
        });
        const tmp = arr[10];
        const globalColorTableFlag = (tmp >>> 7) & 0x1;
        let colorResolution        = (tmp >>> 4) & 0x7;
        var sortFlag               = (tmp >>> 3) & 0x1;
        let sizeOfGlobalColorTable = (tmp >>> 0) & 0x7;
        colorResolution = colorResolution + 1,
        sizeOfGlobalColorTable = Math.pow(2, sizeOfGlobalColorTable + 1);
        const backgroundColorIndex = arr[11];
        const pixelAspectRatio = arr[12];
        chunkList.push({
            name: 'GlobalDesripctor',
            offset: 10,
            bytes: arr.subarray(10, 13),
            infos: [
                {
                    offset: 10,
                    globalColorTableFlag,
                    colorResolution,
                    sortFlag,
                    sizeOfGlobalColorTable
                },
                {
                    offset: 11,
                    backgroundColorIndex
                },
                {
                    offset: 12,
                    pixelAspectRatio
                }
            ]
        });
        let bo = 13;
        let o = bo;

        if (globalColorTableFlag) {
            const globalColorTable = [];

            for (let i = 0; i < sizeOfGlobalColorTable; i++) {
                const subArray = arr.subarray(o, o + 3);
                const hexColor = `#${Utils.ToHexArray(subArray).join('')}`;
                globalColorTable.push(hexColor);
                o += 3;
            }

            chunk = {
                name: 'GlobalColorTable',
                offset: bo,
                bytes: arr.subarray(bo, o),
                infos: [
                    {
                        offset: bo,
                        globalColorTable
                    }
                ]
            };

            chunkList.push(chunk);
            bo = o;
        }

        let trail = false;

        while ((bo < arrLen) && (trail === false)) {
            const separator = arr[bo];
            const name = this.separatorName(separator);
            chunk = { name, offset: bo, bytes: null, infos: null };
            const infos = [{ offset: bo, separator }];

            switch (separator) {
                case 0x3B:  // Trailer (End of GIF Data Stream)
                    o = bo + 1;
                    trail = true;
                    break;
                case 0x21: // Extension Separator
                    const extensionBlockLabel = arr[bo + 1];
                    const extensionDataSize = arr[bo + 2];

                    infos.push({
                        offset: bo + 1,
                        extensionBlockLabel
                    });

                    infos.push({
                        offset: bo + 2,
                        extensionDataSize
                    });

                    if (extensionDataSize === 0) {
                        break; // no data
                    }

                    o = bo + 3;

                    switch (extensionBlockLabel) {
                        case 0xF9: // Graphics Control
                            const tmp = arr[o];
                            const disposalMethod      = (tmp >>> 2) & 0x3;
                            const userInputFlag       = (tmp >>> 1) & 0x1;
                            const transprentColorFlag = (tmp >>> 0) & 0x1;
                            const delayTime =  this.binary.readUint16(arr, o + 1);
                            const transparentColorIndex = arr[o + 3];

                            infos.push(
                                {
                                    offset: o,
                                    disposalMethod,
                                    userInputFlag,
                                    transprentColorFlag
                                },
                                {
                                    offset: o + 1,
                                    delayTime
                                },
                                {
                                    offset: o + 3,
                                    transparentColorIndex
                                }
                            );

                            break;
                        case 0xFE: // Comment Extension
                            const commentData = Utils.ToText(arr.subarray(o, o + extensionDataSize));
                            break;
                        case 0xFF: // Application Extension
                            const applicationIdentifier = Utils.ToText(arr.subarray(o, o + 8));
                            const applicationAuthenticationCode = Utils.ToText(arr.subarray(o + 8, o + 11));

                            infos.push(
                                {
                                    offset: o,
                                    applicationIdentifier
                                },
                                {
                                    offset: o + 8,
                                    applicationAuthenticationCode
                                }
                            );

                            break;
                        default:
                            console.error('unknown extension block label:' + extensionBlockLabel);
                            break;
                    }

                    o += extensionDataSize;

                    if (extensionBlockLabel === 0xFF) { // Application Extension
                        const aoffset = o;
                        const applicationData = [];

                        while (true) {
                            const blockSize = arr[o];
                            infos.push({ offset: o, applicationDataBlockSize: blockSize });

                            if (blockSize === 0) {
                                break;
                            }

                            o += 1;
                            infos.push({ offset: o, nBytes: blockSize });
                            o += blockSize;
                        }
                    }

                    const extensionBlockTrailer = arr[o];

                    infos.push({
                        offset: o,
                        extensionBlockTrailer
                    });

                    o += 1;
                    break;
                case 0x2C: // Image Separator
                    const left   = this.binary.readUint16(arr, bo + 1);
                    const top    = this.binary.readUint16(arr, bo + 3);
                    const width  = this.binary.readUint16(arr, bo + 5);
                    const height = this.binary.readUint16(arr, bo + 7);
                    const tmp = arr[bo + 9];
                    const localColorTableFlag   = (tmp >>> 7) & 0x1;
                    const interlaceFlag         = (tmp >>> 6) & 0x1;
                    const sortFlag              = (tmp >>> 5) & 0x1;
                    const sizeOfLocalColorTable = (tmp >>> 0) & 0x7;
                    sizeOfLocalColorTable = Math.pow(2, sizeOfLocalColorTable + 1);

                    infos.push(
                        {
                            offset: bo + 1,
                            left
                        },
                        {
                            offset: bo + 3,
                            top
                        },
                        {
                            offset: bo + 5,
                            width
                        },
                        {
                            offset: bo + 7,
                            height
                        },
                        {
                            offset: bo + 9,
                            localColorTableFlag,
                            interlaceFlag,
                            sortFlag,
                            sizeOfLocalColorTable:sizeOfLocalColorTable
                        }
                    );

                    o = bo + 10;

                    if (localColorTableFlag) {
                        const localColorTable = [];

                        for (let i = 0; i < sizeOfLocalColorTable; i++) {
                            const subArray = arr.subarray(o, o + 3);
                            const hexColor = `#${Utils.ToHexArray(subArray).join('')}`;
                            localColorTable.push(hexColor);
                            o += 3;
                        }

                        infos.push({
                            offset: bo + 10,
                            localColorTable
                        });
                    }

                    const lzwMinimumCodeSize = arr[o];

                    infos.push({ offset: o, lzwMinimumCodeSize });

                    o += 1;

                    const ioffset = o;
                    const imageData = [];

                    while (true) {
                        const blockSize = arr[o];

                        infos.push({ offset: o, imageBlockSize: blockSize });

                        if (blockSize === 0) {
                            o += 1;
                            break;
                        }

                        o += 1;

                        infos.push({ offset: o, nBytes: blockSize });

                        o += blockSize;
                    }

                    break;
               default:
                   console.error('unknown separator:' + separator);
                   trail = true;
                   break;
            }

            chunk.bytes = arr.subarray(bo, o);
            chunk.infos = infos;
            chunkList.push(chunk);
            bo = o;
        }

        this.chunkList = chunkList;
    }

    getChunkList() {
        return this.chunkList;
    }

    build() {
        // TODO:
    }

    getICC() {
        for (const idx in this.chunkList) {
            const chunk = this.chunkList[idx];

            if (chunk.name === 'Extension') {
                let iccFound = false;
                const iccBlockList = [];
                let iccProfileSize = 0;

                for (const i in chunk.infos) {
                    const info = chunk.infos[i];

                    if (info.applicationIdentifier === 'ICCRGBG1') {
                        iccFound = true;
                    }

                    if (iccFound) {
                        if (info.nBytes) {
                            const offset = info.offset;
                            const size = info.nBytes;
                            iccBlockList.push(this.data.subarray(offset, offset + size));
                            iccProfileSize += size;
                        }
                    }
                }

                if (iccFound) {
                    const iccProfileArr = new Uint8Array(iccProfileSize);
                    const offset = 0;

                    for (let i = 0, n = iccBlockList.length; i < n; i++) {
                        const blockBytes = iccBlockList[i];
                        iccProfileArr.set(blockBytes, offset);
                        offset += blockBytes.length;
                    }

                    return iccProfileArr;
                }
            }
        }

        console.warn('Not found ICC profile in GIF');

        return null;
    }
}
