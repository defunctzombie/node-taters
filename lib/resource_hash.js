var crypto = require('crypto');
var http = require('http');

module.exports = function(req, opt) {
    var cached = {};

    opt = opt || {};
    var cache_hashes = false || opt.cache;
    var headers = opt.headers

    var opt = {
        host: 'localhost',
        headers: headers
    };

    opt.port = req.connection.address().port;
    opt.host = req.connection.address().address;

    return function(route, cb) {

        if (!opt.port) {
            return cb(new Error('port not yet configured for fingerpriner'));
        }

        var cache = cached[route];
        if (cache) {
            return cb(null, cache);
        }

        opt.path = route;

        var request = http.request(opt, function(res) {
            var digest = crypto.createHash('md5');
            if (res.statusCode < 200 || res.statusCode >= 400) {
                return cb(new Error("Unable to hash "+route+": "+res.statusCode+" "+res.statusText));
            }

            res.on('data', function(chunk) {
                digest.update(chunk);
            });

            res.on('end', function() {
                var hash = digest.digest('hex');

                if (cache_hashes) {
                    cached[route] = hash;
                }

                cb(null, hash);
            });

            res.on('error', cb);
        });
        request.on('error', cb);
        request.end();
    };
};

