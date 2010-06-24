G = G || {};
G.Ring = function (size) {
    this.length = size;
    this._position = 0;
    this._buffer = [];
    for (var i = 0; i < size; i++) {
        this._buffer.push(null);
    }

    this.push = function (obj) {
        this._buffer[this._position] = obj;
        this._position++;
        if (this._position == this.length) {
            this._position = 0;
        }
    }

    this.index = function (idx) {
        idx += this._position;
        if (idx >= this.length) {
            idx -= this.length;
        }
        else if (idx < 0) {
            idx += this.length;
        }
        return this._buffer[idx];
    }

    this.forEach = function (mapper) {
        for (var i = 0; i < this.length; i++) {
            var obj = this.index(i);
            mapper(obj);
        }
    }

    this.first = function () {
        return this._buffer[this._position];
    }

    this.last = function () {
        var p = this._position - 1;
        if (p < 0) {
            p += this.length;
        }
        return this._buffer[p];
    }
};
