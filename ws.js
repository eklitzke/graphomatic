var ws = require('ws');
var sys = require('sys');

var intervals = {};

var server = ws.createServer({debug: true});

var cycle_length = 30 * 1000; // ten seconds
var timeout = cycle_length / 60;

server.addListener("connection", function (conn) {
    var sendData = function () {
        var now = (new Date()).valueOf();
        var val = Math.sin((now % cycle_length) * 2 * Math.PI / cycle_length) * 0.50 + 0.5;
        val += Math.random() * 0.1 - 0.05;
        if (val < 0.02)
            val = 0.02;

        server.send(conn._id, JSON.stringify({'millis': now, 'val': val}));
    }
    intervals[conn._id] = setInterval(sendData, timeout);
});

server.addListener("close", function (conn) {
    clearInterval(intervals[conn._id]);
});

server.listen(8214, "localhost");
