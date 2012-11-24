
// vendor
var dombie = require('dombie');
var dombie_str = require('dombie-str');

// local
var resource_hash = require('./lib/resource_hash');
var fingerprint = require('./lib/fingerprint');

module.exports = function(opt, mware) {
    var tot = undefined;

    mware = mware || function(req, res, next) {
        res.header('Cache-Control', 'public, max-age=31536000');
        res.header('Vary', 'Accept-Encoding');
        next();
    };

    return function(req, res, next) {
        if (!tot) {
            tot = tater(req, opt);
        }

        // if not a taters url, skip
        if (!req.url.match(/\/static\/[a-f0-9]+\/(.*)/)) {
            return next();
        }

        // remove fingerprint from url for lookup in filesystem
        var url = RegExp.$1;
        req.url = '/' + RegExp.$1;

        mware(req, res, next);
    };
};

var tater = function(req, opt) {

    var app = req.app;

    // printer will do the actual fingerprinting of resources
    var printer = fingerprint(resource_hash(req, opt));

    var orig_render = app.render;
    app.render = function() {
        var self = this;

        // replace the specified callback argument
        // with our proxy
        var orig_cb = arguments[2];
        arguments[2] = function(err, str) {
            if (err) {
                return orig_cb(err, str);
            }

            // this is where we do our transformations
            dombie(str, function(err, dom) {
                if (err) {
                    return orig_cb(err, str);
                }

                printer(dom, function(err) {
                    if (err) {
                        return orig_cb(err, str);
                    }

                    dombie_str(dom, orig_cb);
                });
            });
        };

        // call original render function
        orig_render.apply(self, arguments);
    };

    return app.render;
};

