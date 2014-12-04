var crypto = require('crypto');
var http = require('http');
var debug = require('debug')('taters');

var ResourceHash = function(opt) {
    if (!(this instanceof ResourceHash)) {
        return new ResourceHash(opt);
    }

    var self = this;
    opt = opt || {};

    self._use_cache = opt.cache;
    self._cached = Object.create(null);
};

ResourceHash.prototype.hash = function(route, opt, cb) {
    var self = this;
    opt = opt || {};

    // TODO (roman) detect if already processing same url
    // and wait on that result instead of asking to re-hash
    // maybe use ready-signal module

    var cached = self._cached;

    var cache = cached[route];
    if (cache && self._use_cache) {
        debug('using cached value for %s', route);
        return cb(null, cache);
    }

    var req_opt = {
        host: opt.host,
        port: opt.port,
        path: route
    };

    debug('requesting %s:%s%s', opt.host, opt.port, route);

    http.get(req_opt, function(res) {
        // we don't hash failed responses
        if (res.statusCode != 200) {
            var err = new Error('failed to get ' + route + ' [' + res.statusCode + ']');
            err.status = res.statusCode;
            return cb(err);
        }

        var digest = crypto.createHash('md5');

        res.on('data', function(chunk) {
            digest.update(chunk);
        });

        res.on('end', function() {
            var hash = digest.digest('hex').slice(0, 6);
            debug('caching %s %s', route, hash);
            cached[route] = hash;
            cb(null, hash);
        });

        res.on('error', function(err) {
            cb(err);
        });
    });
};

module.exports = ResourceHash;
