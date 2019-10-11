/*
 * 2017/01/05- (c) yoya@awm.jp
 */

export function IsSafari() {
    const ua = navigator.userAgent;
    const hasVersion = ua.indexOf('Version/') > -1;
    const hasChrome  = ua.indexOf('Chrome/') > -1;
    const hasSafari  = ua.indexOf('Safari/') > -1;
    return hasVersion && (!hasChrome) && hasSafari;
}

export function dropFunction(target, func, datatype) {
    // console.debug("dropFunction:", target, func, datatype);

    const cancelEvent = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const fileReadEvent = (file, func) => {
        // console.debug("fileReadEvent:", file, func);

        const reader = new FileReader();

        reader.onload = (e) => {
            // console.debug("reader.onload", e, e.target.result);
            func(e.target.result);
        };

        switch (datatype) {
            case 'DataURL':
                reader.readAsDataURL(file);
                break;
            case 'ArrayBuffer':
                reader.readAsArrayBuffer(file);
                break;
            default:
                console.error('Unknown datatype:' + datatype);
                break;
        }
    };

    target.addEventListener('dragover', cancelEvent, false);
    target.addEventListener('dragenter', cancelEvent, false);

    target.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files[0];

        if (file) {
            fileReadEvent(file, func);
        }
    }, false);

    if (!IsSafari()) { // Chrome, Firefox
        // ref) http://qiita.com/tatesuke/items/00de1c6be89bad2a6a72
        target.addEventListener('paste', (e) => {
            // console.debug("paste", e);
            e.preventDefault();
            e.stopPropagation();

            if (e.clipboardData.items) { // Chrome/Firefox
                const item = e.clipboardData.items[0];
                const type = item.type;

                if ((type === 'file') || (type.indexOf('image/') === 0)) {
                    const file = item.getAsFile();

                    if (file) {
                        fileReadEvent(file, func);
                    } else {
                        console.error('getAsFile => null');
                    }
                } else { // "string" for Chrome
                    item.getAsString((t) => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(t, 'text/html');
                        const img = doc.querySelector('img');
                        const src = img.getAttribute('src');
                        func(src);
                    });
                }
            }
        }, false);
    } else { // Safari
        let editElement = document.body;

        if (target.setAttribute) {
            editElement = target;
        } else {
            console.warn('target has no setAttribute, fallback to document body.');
        }

        editElement.setAttribute('contentEditable', 'true');

        target.addEventListener('input', (e) => { // Safari
            e.preventDefault();
            e.stopPropagation();

            const elem = e.target;
            const imgElem = elem.querySelector('img');

            if (imgElem) {
                const base64 = imgElem.src;
                imgElem.parentNode.removeChild(imgElem);
                func(base64);
            }

            if (e.inputType !== 'historyUndo') {
                document.execCommand('undo', false, null);
            }
        }, false);
    }

    // no pastable environment.
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    // input.setAttribute("style", "visibility:hidden;");
    const body = document.body;
    body.appendChild(input);
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        fileReadEvent(file, func);
    });
}
