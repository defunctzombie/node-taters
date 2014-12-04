var htmltree = require('htmltree');
var http = require('http');
var debug = require('debug')('taters');

var ResourceHash = require('./lib/resource_hash');
var fingerprint = require('./lib/fingerprint');
var render = require('./lib/render');

var Taters = function(app, opt) {
    if (!(this instanceof Taters)) {
        return new Taters(app, opt);
    }

    var self = this;
    opt = opt || {};
    self.opt = opt;

    self.app = app;
    self.address = undefined;
    self.hashgen = ResourceHash(opt);

    self.mware = opt.mware || function(req, res, next) {
        res.header('Cache-Control', 'public, max-age=31536000');
        res.header('Vary', 'Accept-Encoding');
        next();
    };

    self._init_server();

    // load existing view engine
    var view_engine = app.get('view engine');
    debug('existing view engine %s', view_engine);

    var view_ext = view_engine;
    if (view_ext[0] !== '.') {
        view_ext = '.' + view_engine;
    }

    self.engine_fn = app.engines[view_ext];
    if (!self.engine_fn) {
        self.engine_fn = require(view_engine).__express;
    }
    app.engine(view_engine, self.engine.bind(self));

    app.use(self.middleware.bind(self));
};

Taters.prototype._init_server = function() {
    var self = this;
    var server = http.createServer(self.app);
    server.listen(0, '127.0.0.1', function(err) {
        if (err) {
            throw err;
        }

        self.address = server.address();
    });

    self.app.once('close', function() {
        server.end();
    });
};

Taters.prototype.engine = function(filename, render_opts, cb) {
    var self = this;
    var addr = self.address;
    if (!addr) {
        return cb(new Error('taters server has not started yet'));
    }

    var opt = self.opt;

    self.engine_fn(filename, render_opts, function(err, html) {
        if (err) {
            return cb(err);
        }

        var req_opt = {
            host: addr.address,
            port: addr.port
        };

        // printer will do the actual fingerprinting of resources
        var printer = fingerprint(opt, self.hashgen.hash_maker(req_opt));

        // this is where we do our transformations
        htmltree(html, function(err, doc) {
            if (err) {
                return cb(err);
            }

            printer(doc.root, function(err) {
                if (err) {
                    return cb(err);
                }

                var stream = render(doc);

                var out = '';
                stream.on('data', function(chunk) {
                    out += chunk;
                });

                stream.once('end', function() {
                    return cb(null, out);
                });
            });
        });
    });
};

Taters.prototype.middleware = function(req, res, next) {
    var self = this;
    var addr = self.address;
    if (!addr) {
        return next(new Error('taters server has not started yet'));
    }

    // if not a taters url, skip
    var match = req.url.match(/\/static\/([a-f0-9]+)\/(.*)/);
    if (!match) {
        return next();
    }

    var exp_hash = match[1];
    var url = '/' + match[2];

    var req_opt = {
        host: addr.address,
        port: addr.port
    };

    self.hashgen.hash(url, req_opt, function(err, act_hash) {
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
        self.mware(req, res, next);
    });
};

module.exports = Taters;
