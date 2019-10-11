/*
 * 2017/02/27- (c) yoya@awm.jp
 */

export function bindFunction(idMap, callback) {
    for (const id1 in idMap) {
        const id2 = idMap[id1];
        const elem1 = document.getElementById(id1);

        if (!elem1) {
            console.error('!elem1 <= id1:' + id1);
            return;
        }

        let type = elem1.type;

        const elem2 = document.getElementById(id2);

        if (id2) {
            if (!elem2) {
                console.error('!elem2 <= id2:' + id2);
                return;
            }

            type += ':' + elem2.type;
        }

        // console.debug("bind type:"+type+", id1:"+id1+", id2:"+id2);

        switch (type) {
            case 'range:text':
                bindRange2TextFunction(elem1, elem2, callback);
                break;
            case 'checkbox':
                bindChangeEvent(elem1, callback);
                break;
            case 'select-one':
                bindChangeEvent(elem1, callback);
                break;
            case 'text':
                bindChangeEvent(elem1, callback);
                break;
            case 'button':
                bindClickEvent(elem1, callback);
                break;
            case 'radio':
                bindChangeEvent(elem1, callback);
                break;
            default:
                console.error('Unknown bind type:' + type + ', id1:' + id1 + ', id2:' + id2);
                break;
        }
    }
}

// Private functions

function bindRange2TextFunction(range, text, callback) {
    // text.value = range.value; // firefox does not work.
    text.value = range.getAttribute('value');

    range.addEventListener('input', () => {
        text.value = range.value;
        callback && callback(range, false);
    });

    range.addEventListener('mouseup', () => {
        text.value = range.value;
        callback && callback(range, true);
    });

    text.addEventListener('change', () => {
        range.value = text.value;
        callback && callback(text, true);
    });
}

// includes: checkbox, select-one
function bindChangeEvent(target, callback) {
    target.addEventListener('change', () => {
        callback && callback(target);
    });
}

// button
function bindClickEvent(target, callback) {
    target.addEventListener('click', () =>  {
        callback && callback(target);
    });
}

/*
 * table binding
 */
function prefixTableValue(tableId) {
    return tableId + '_';
}

function setTableValues(tableId, values) {
    const valueIdPrefix = prefixTableValue(tableId);

    for (let i = 0, n = values.length; i < n; i++) {
        const inputId = valueIdPrefix + i;
        const input = document.getElementById(inputId);

        if (input.type === 'text') {
            input.value = values[i];
        } else if ((input.type === 'radio') || (input.type === 'checkbox')) {
            input.checked = values[i];
        } else {
            console.error('illegal type:' + input.type); } } } function getTableValues(tableId) { const valueIdPrefix = prefixTableValue(tableId); const values = []; for (let i = 0; true; i++) { const inputId = valueIdPrefix + i; const input = document.getElementById(inputId); if (input === null) { break; } if (input.type === 'text') {
            values.push(parseFloat(input.value));
        } else if ((input.type === 'radio') || (input.type === 'checkbox')) {
            values.push(input.checked);
        } else {
            console.error('illegal type:' + input.type);
        }
    }

    return values;
}

function bindTableFunction(tableId, callback, values, width, type) {
    const table = document.getElementById(tableId);
    const n = values.length;
    const height = (n / width) >> 0;

    // generate filter table dom
    if (n !== width * height) {
        console.error('n:' + n + ' !== width:' + width + ' * height:' + height);
    }

    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }

    const valueIdPrefix = prefixTableValue(tableId);

    let i = 0;

    for (let y = 0; y < height; y++) {
        const tr = document.createElement('tr');
        table.appendChild(tr);

        for (let x = 0; x < width; x++) {
            const td = document.createElement('td');
            tr.appendChild(td);
            const input = document.createElement('input');
            td.appendChild(input);

            if ((type === 'radio') || (type === 'checkbox')) {
                input.type = type;
                input.name = tableId;
            } else {
                input.type = 'text';
            }

            input.id = valueIdPrefix + i;
            input.size = 8;
            i++;
        }
    }

    setTableValues(tableId, values);

    for (let i = 0; i < n; i++) {
        const map = {};
        map[valueIdPrefix + i] = null;

        bindFunction(map, (target) => {
            values = getTableValues(tableId);
            callback(table, values, width);
        });
    }
}
