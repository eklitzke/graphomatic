var G = G || {};

Raphael.el.purple = function () {
    var p = "#5f3ea9";
    this.attr({fill: p, stroke: p});
};

Raphael.el.green = function () {
    var g = "#4bab46";
    this.attr({fill: g, stroke: g});
};

Raphael.el.red = function() {
    var r = "#ff0000";
    this.attr({fill: r, stroke: r});
};

G.Canvas = function (paper, params) {
    this.clickedElement = null;

    this.background = [];

    this.toBox = function (point, pos) {
        var x, y;
        if (pos !== undefined) {
            pos = pos || 0;
            x = params.vruleOffset + params.gapSize * (pos + 1) + params.barWidth * pos;
        } else {
            x = params.vruleOffset;
        }
        var height = params.height * 0.90 * point.val / params.maxVal;
        y = params.height - height;
        return {"x": x, "y": y, "width": 10, "height": height};
    };

    var me = this;
    for (var i = 0; i < params.numPoints; i++) {
        var box = this.toBox({"val": 0.0}, i);
        var rect = paper.rect(box.x, 0, box.width, params.height);
        rect._hovered = false;
        rect.attr({"fill": "#000", "stroke": "#000", "opacity": 0.0});

        rect.hover(function () {
            this._hovered = true;
            if (this._contained) {
                this._contained.red();
            }
        }, function () {
            this._hovered = false;
            if (this._contained) {
                if (me.clickedElement === this._contained) {
                    this._contained.green();
                } else {
                    this._contained.purple();
                }
            }
        });

        rect.click(function (event) {
            if (me.clickedElement) {
                me.clickedElement.purple(); // FIXME: need to check for hover
            }
            me.clickedElement = this._contained;
            if (me.clickedElement) {
                me.clickedElement.green();
            }
        });

        rect.beforeContainedMove = function () {
            if (this._hovered && this._contained) {
                if (me.clickedElement === this._contained) {
                    this._contained.green();
                } else {
                    this._contained.purple();
                }
            }
        };
        rect.afterContainedMove = function () {
            if (this._hovered && this._contained) {
                this._contained.red();
            }
        };
        rect._contained = null;
        this.background.push(rect);
    }

    this.moveLeft = function (newPoint) {
        newPoint = newPoint || null;
        var movement = params.gapSize + params.barWidth;
        var vbars = [];
        if (this.background[0]._contained) {
            this.background[0]._contained.remove();
        }
        for (var i = 0; i < this.background.length - 1; i++) {
            var b = this.background[i];
            b.beforeContainedMove();
            b._contained = this.background[i + 1]._contained;
            b.afterContainedMove();
            if (b._contained) {
                b._contained._x = b._contained.attrs.x - movement;
                vbars.push(b._contained);
            }
        }
        this.background[this.background.length - 1].beforeContainedMove();
        if (vbars.length) {
            var first = vbars[0];
            first.animate({"x": first._x}, params.animateTime);
            for (var i = 1; i < vbars.length; i++) {
                vbars[i].animateWith(first, {"x": vbars[i]._x}, params.animateTime);
            }
        }
    };

    this.addData = function (data) {
        var data = JSON.parse(data);
        return this.addPoint(data);
    };

    this.addPoint = function (data) {
        var box = this.toBox(data, params.numPoints - 1);
        var rect = paper.rect(box.x, box.y, box.width, box.height, 3);
        rect.toBack();
        rect.purple();
        this.moveLeft(rect);

        var lastBackground = this.background[this.background.length - 1];
        lastBackground._contained = rect;
        if (lastBackground._hovered) {
            rect.red();
        }
    };
};

G.initialize = function (ws_url, params) {
    G.ws_url = ws_url || "ws://localhost:8214";
    G.params = params = params || {};
    addParam = function (name, default_) {
        if (!(name in G.params)) {
            G.params[name] = default_;
        }
    }
    addParam("animateTime", 200);
    addParam("barWidth", 10);
    addParam("gapSize", 2);
    addParam("height", 600);
    addParam("maxVal", 1.0);
    addParam("numPoints", 65);
    addParam("vruleOffset", 10);
    addParam("width", 800);

    G.paper = Raphael(document.getElementById("graph"), 800, 600);
    G.paper.path("M5,0L5," + (params.height - 1));
    G.paper.path("M5," + (params.height - 1) + "L" + params.width + "," + (params.height - 1));

    var canvas = new G.Canvas(G.paper, params);
    G.canvas = canvas;

    var now = (new Date()).valueOf();
    for (var i = 0; i < params.numPoints; i++) { 
        var p = {"millis": now - 60 + i, "val": 0};
        G.canvas.addPoint(p);

        /*
        var dims = F.to_size(p, i);
        var b = F.paper.rect(dims.x - 1, 0, dims.width + F.GAP_SIZE, F.HEIGHT);
        b.attr({"stroke": "#000000", "fill": F.colors.green, "opacity": 0.3});
        b.hover(function () {
            this.attr({"opacity": 1.0});
        }, function () {
            this.attr({"opacity": 0.3});
        });
        */
    }
}

G.start_running = function () {
    G.socket = new WebSocket(G.ws_url);
    G.socket.onmessage = function (event) {
        G.canvas.addPoint(JSON.parse(event.data));
    };
}

G.stop_running = function () {
    G.socket.close();
}
