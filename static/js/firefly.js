var F = F || {};
F.socket;

F.ANIMATE_TIME = 200;
F.NUM_POINTS = 60
F.WIDTH = 800
F.HEIGHT = 600;
F.GAP_SIZE = 3;
F.MAX_VAL = 1.0;
F.VRULE_OFFSET = 10;

F.bar_clicked = null;
F.hover_label = null;
F.click_label = null;

F.update_hover_label = function (new_text) {
    if (F.hover_label) {
        F.hover_label.remove()
    }
    F.hover_label = F.paper.text(F.WIDTH - 50, 32, new_text);
    F.hover_label.attr({'font-size': 16, 'font-family': 'Inconsolata, monospace'});
    F.hover_label.attr({'fill': 'red', 'stroke': 'red'});
}

F.update_click_label = function (new_text) {
    if (F.click_label) {
        F.click_label.remove()
    }
    F.click_label = F.paper.text(F.WIDTH - 50, 12, new_text);
    F.click_label.attr({'font-size': 16, 'font-family': 'Inconsolata, monospace'});
    F.click_label.attr({'fill': F.colors.green, 'stroke': F.colors.green});
}

F.colors = {}
F.colors.green = "#4bab46";
F.colors.purple = "#5f3ea9";

F.points = new F.Ring(F.NUM_POINTS);


F.add_point = function (point) {
    var right = F.points.last();
    for (var i = F.points._size - 2; i >= 0; i--) {
        var left = F.points.index(i);
        right._dims.x = left._dims.x;
        right = left;
    }
    if (F.bar_clicked == left) {
        F.bar_clicked = null;
    }
    left.remove();
    F.points.push(F.to_rectangle(point, F.NUM_POINTS - 1));

    var first = F.points.first();
    first.animate({"x": first._dims.x}, F.ANIMATE_TIME);
    F.points.forEach(function (p) { p.animateWith(first, {"x": p._dims.x}, F.ANIMATE_TIME); });

    F.min_time = F.points.first()._millis;
    F.max_time = F.points.last()._millis;
}

F.to_size = function (point, pos) {
    var x, y;
    if (pos !== undefined) {
        pos = pos || 0;
        x = F.VRULE_OFFSET + F.GAP_SIZE * (pos + 1) + 10 * pos - 5;
    } else {
        x = F.VRULE_OFFSET;
    }
    var height = F.HEIGHT * 0.90 * point.val / F.MAX_VAL;
    y = F.HEIGHT - height;
    
    return {"x": x, "y": y, "width": 10, "height": height};
}

F.to_rectangle = function (point, pos) {
    var dims = F.to_size(point, pos);
    r = F.paper.rect(dims.x, dims.y, dims.width, dims.height, 3).attr({"fill": F.colors.purple, "stroke": F.colors.purple});
    r._dims = dims;
    r._val = point.val;
    r._millis = point.millis;

    r.hover(function () {
        this.attr({fill: "red", stroke: "red"});
        var txt = new String(r._val);
        txt = txt.slice(0, 6);
        F.update_hover_label(txt);
    }, function () {
        if (F.bar_clicked == this) {
            this.attr({fill: F.colors.green, stroke: F.colors.green});
        } else {
            this.attr({fill: F.colors.purple, stroke: F.colors.purple});
        }
        F.update_hover_label("");
    });

    r.click(function (event) {
        if (F.bar_clicked == null) {
            F.bar_clicked = this;
            this.attr({fill: F.colors.green, stroke: F.colors.green});
        } else if (F.bar_clicked == this) {
            F.bar_clicked = null;
            this.attr({fill: F.colors.purple, stroke: F.colors.purple});
        } else {
            F.bar_clicked.attr({fill: F.colors.purple, stroke: F.colors.purple});
            F.bar_clicked = this;
            this.attr({fill: F.colors.green, stroke: F.colors.green});
        }
        var txt = new String(this._val);
        txt = txt.slice(0, 6);
        F.update_click_label(txt);
    });
    return r;
}

F.log = function (data) {
    if (window.console && window.console.info) {
        window.console.info(data);
    }
}

F.onload = function () {
    F.paper = Raphael(document.getElementById("graph"), 800, 600);
    F.paper.path("M5,0L5," + (F.HEIGHT - 1));
    F.paper.path("M5," + (F.HEIGHT - 1) + "L" + F.WIDTH + "," + (F.HEIGHT - 1));
    var now = (new Date()).valueOf();
    for (var i = 0; i < F.NUM_POINTS; i++) { 
        var p = {"millis": now - 60 + i, "val": 0};
        var rect = F.to_rectangle(p, i);
        F.points.push(rect);
    }
    F.min_time = F.points.first()._millis;
    F.max_time = F.points.last()._millis;
}

F.start_running = function () {
    F.socket = new WebSocket("ws://localhost:8214");
    F.socket.onopen = function () {
        F.log('opened connection');
    };
    F.socket.onmessage = function (event) {
        F.log(event.data);
        F.add_point(JSON.parse(event.data));
    };
}

F.stop_running = function () {
    F.log('stop_running');
    F.socket.close();
}
