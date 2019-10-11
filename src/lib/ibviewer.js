/*
  2017/01/05- yoya@awm.jp
*/

import { Utils } from './utils';

export class ImageBinaryViewer {
    constructor(containerNode, imageClassList) {
        this.containerNode = containerNode;
        this.imageClassList = imageClassList;
    }

    reset() {
        const containerNode = this.containerNode;

        while (containerNode.firstChild) {
            containerNode.removeChild(containerNode.firstChild);
        }
    }

    add(buf) {
        let arr = new Uint8Array(buf);
        let io = null;

        for (let i = 0; i < 100; i++) { // retry: 100
            for (const imgClass of this.imageClassList) {
                if (imgClass.verifySig(arr)) {
                    io = new imgClass();
                }
            }

            if (io !== null) {
                break;
            }

            arr = arr.subarray(1);
        }

        let chunkList = null;

        if (io !== null) {
            io.parse(arr);
            chunkList = io.getChunkList();
            console.debug(chunkList);
        } else {
            chunkList = [{ name: 'Unknown Image Type', offset: 0, bytes: arr, info: [] }];
            console.error('Unknown Image Signature:' + arr.subarray(0, 8).toString());
        }

        const containerNode = this.containerNode;

        const fileNode = document.createElement('div');
        fileNode.className = 'imgFile';

        for (const chunk of chunkList) {
            const chunkNode = document.createElement('div');
            chunkNode.className = 'imgChunk';
            const name = chunk.name;
            const bytes = chunk.bytes;
            let hexArray = null;
            let hexDump = '';
            chunkNode.innerHTML = name;

            if ('infos' in chunk) {
                if (chunk.offset < chunk.infos[0].offset) {
                    console.error('chunk.offset:' + chunk.offset + '< chunk.infos[0].offset:' + chunk.infos[0].offset + ' on ' + name);
                }

                for (let idx in chunk.infos) {
                    idx = idx >>> 0;
                    const info = chunk.infos[idx];
                    const offset = info.offset;

                    let nextOffset;

                    if ((idx + 1) < chunk.infos.length) {
                        nextOffset = chunk.infos[idx + 1].offset;
                    } else {
                        nextOffset = chunk.offset + bytes.length;
                    }

                    const infoNode = document.createElement('div');
                    const dumpNode = document.createElement('div');
                    infoNode.className = 'imgInfo';
                    dumpNode.className = 'imgDump';
                    const infoBytes = bytes.subarray(offset - chunk.offset, nextOffset - chunk.offset);
                    const offset = info.offset;
                    delete info.offset;
                    const infoJson = JSON.stringify(info, null, ' ');
                    hexArray = Utils.ToHexArray(infoBytes);
                    hexDump = hexArray.join(' ');
                    infoNode.innerHTML = `<tt> offset:0x${Utils.ToHex(offset)}, ${infoJson}</tt>`;
                    dumpNode.innerHTML = `<tt>${hexDump}</tt>`;
                    chunkNode.appendChild(infoNode);
                    chunkNode.appendChild(dumpNode);
                }
            } else {
                const dumpNode = document.createElement('div');
                dumpNode.className = 'imgDump';
                hexArray = Utils.ToHexArray(bytes); hexDump = hexArray.join(' ');
                dumpNode.innerHTML = `<tt>${hexDump}</tt>`;
                chunkNode.appendChild(dumpNode);
            }

            fileNode.appendChild(chunkNode);
        }

        containerNode.appendChild(fileNode);
    }
}
