
// vendor
var htmltree = require('htmltree');

// local
var resource_hash = require('./lib/resource_hash');
var fingerprint = require('./lib/fingerprint');
var render = require('./lib/render');

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
            htmltree(str, function(err, doc) {
                if (err) {
                    return orig_cb(err, str);
                }

                printer(doc.root, function(err) {
                    if (err) {
                        return orig_cb(err, str);
                    }

                    var stream = render(doc);

                    var out = '';
                    stream.on('data', function(chunk) {
                        out += chunk;
                    });

                    stream.on('end', function() {
                        orig_cb(null, out);
                    });
                });
            });
        };

        // call original render function
        orig_render.apply(self, arguments);
    };

    return app.render;
};

