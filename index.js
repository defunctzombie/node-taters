var htmltree = require('htmltree');

var ResourceHash = require('./lib/resource_hash');
var fingerprint = require('./lib/fingerprint');
var render = require('./lib/render');

module.exports = function(opt, mware) {
    var tot = undefined;

    mware = mware || function(req, res, next) {
        res.header('Cache-Control', 'public, max-age=31536000');
        res.header('Vary', 'Accept-Encoding');
        next();
    };

    var hashgen = ResourceHash(opt);

    return function(req, res, next) {
        if (!tot) {
            // shim app.render
            tot = tater(req, opt, hashgen);
        }

        // if not a taters url, skip
        if (!req.url.match(/\/static\/([a-f0-9]+)\/(.*)/)) {
            return next();
        }

        var exp_hash = RegExp.$1;
        var url = '/' + RegExp.$2;

        var addr = req.connection.address();
        var req_opt = {
            host: addr.address,
            port: addr.port
        };

        hashgen.hash(url, req_opt, function(err, act_hash) {
            if (err) {
                return next(err);
            }
            else if (!act_hash) {
                return res.status(404).end();
            }
            else if (act_hash != exp_hash) {
                return res.status(404).end();
            }

            req.url = url;
            mware(req, res, next);
        });
    };
};

var tater = function(req, opt, hashgen) {
    var app = req.app;
    opt = opt || {};

    var addr = req.connection.address();
    var req_opt = {
        host: addr.address,
        port: addr.port
    };

    // printer will do the actual fingerprinting of resources
    var printer = fingerprint(opt, hashgen.hash_maker(req_opt));

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

