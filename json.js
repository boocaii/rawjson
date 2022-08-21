

function isBlank(c) {
    return c === ' ' || c === '\t' || c === '\n'
}

function isValue(c) {
    return c.match(/[a-z]/i)
}


class UntouchedJSON {
    constructor(data) {
        if (typeof data !== 'string') {
            throw Error('data must be string')
        }
        this.data = data
        this.at = 0
        this.parsedObj = null
        this.str = ''
        this.indent = '  '
        this.indent_depth = 0
    }

    moveToNonBlankPos() {
        while (this.at < this.data.length && isBlank(this.data[this.at])) { this.at++ }
    }
    next() {
        do {
            this.at++
        } while (this.at < this.data.length && isBlank(this.cur()))
    }
    cur() {
        this.moveToNonBlankPos()
        // console.log(`at: ${this.at}, val: ${this.at < this.data.length ? this.data[this.at] : ''}`)
        return this.at < this.data.length ? this.data[this.at] : ''
    }
    skip(c) {
        if (this.cur() !== c) {
            throw new Error(`must be ${c}, not ${this.cur()}`);
        }
        this.next()
    }

    readUntil(ends) {
        let s = ''
        while (!ends.includes(this.cur())) {
            s += this.cur()
            this.next()
        }
        return s
    }

    // write(s) { this.str += s }

    write(s, no_indent = false) {
        this.str += (no_indent ? '' : this.indent.repeat(this.indent_depth)) + s
    }

    parse() {
        this.parsedObj = this.__parse__();
        return this.parsedObj
    }

    __parse__() {
        while (!['', '}', ']'].includes(this.cur())) {
            const c = this.cur();
            switch (c) {
                case '[':
                    return this.parse_array()
                case '{':
                    return this.parse_object()
                default:
                    // parse value
                    return this.parse_value()
            }
        }
    }



    parse_array() {
        let arr = [];
        this.skip('[')
        while (1) {
            const ele = this.__parse__();
            if (ele !== undefined) {
                arr.push(ele);
            }
            if (this.cur() === ',') {
                this.skip(',')
            } else if (this.cur() === ']') {
                break
            } else {
                throw new Error(`must be ',' or ']', not '${this.cur()}'`)
            }
        }
        this.skip(']')
        return arr
    }

    parse_object() {
        let obj = {};
        this.skip('{')
        while (this.cur() === '"') {
            const key = this.parse_key()
            this.skip(':')
            const val = this.__parse__()
            console.log(`key: ${key}, val: ${val}`)
            obj[key] = val;

            if (this.cur() === ',') {
                this.skip(',')
            } else if (this.cur() === '}') {
                break
            } else {
                throw new Error(`must be ',' or '}', not '${this.cur()}'`)
            }
        }
        this.skip('}')
        return obj;
    }

    parse_key() {
        this.skip('"')
        let key = ''
        while (!['', '"'].includes(this.cur()) && isValue(this.cur())) {
            key += this.cur()
            this.next()
        }
        this.skip('"')
        return key
    }

    parse_value() {
        this.moveToNonBlankPos()
        return this.readUntil([',', ']', '}'])
    }

    stringify() {
        this.__stringify__(this.parsedObj)
        return this.str
    }

    __stringify__(obj) {
        if (Array.isArray(obj)) {
            this._stringify_array(obj)
        } else if (typeof obj === 'object') {
            this._stringify_object(obj)
        } else {
            this._stringify_value(obj)
        }
    }

    _stringify_array(arr) {
        this.write('[', true)
        this.indent_depth++
        for (let i = 0; i < arr.length; i++) {
            this.write('\n', true)
            this.write('')
            this.__stringify__(arr[i])
            if (i !== arr.length - 1) { this.write(',', true) }
        }
        this.indent_depth--
        if (arr.length) {
            this.write('\n', true)
            this.write(']')
        } else {
            this.write(']', true)
        }
    }

    _stringify_object(obj) {
        this.write('{', true)
        this.indent_depth++
        const entries = Object.entries(obj)
        for (let i = 0; i < entries.length; i++) {
            const key = entries[i][0], value = entries[i][1]
            console.log(`key: ${key}, value: ${value}`)
            this.write('\n', true)
            // this.write('')
            this.write(`"${key}": `)
            this.__stringify__(value)
            if (i !== entries.length - 1) { this.write(',', true) }
        }
        this.indent_depth--
        if (entries.length) {
            this.write('\n', true)
            this.write('}')
        } else {
            this.write('}', true)
        }
    }

    _stringify_value(val) {
        this.write(val, true)
    }


}


const j = new UntouchedJSON('[{"a": {"b": {}, "c": [1, 2, {"d": ["e", 5.002, {}, []]}]}}]');
console.log('raw stringify:', JSON.stringify(j.parse()))
console.log('notouch json stringify:\n' + j.stringify())


/*

{
    "a": {
        "b": [
            1,
            2,
            3
        ]
    }
}

*/