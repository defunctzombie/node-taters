var crypto = require('crypto');
var http = require('http');
var https = require('https');

module.exports = function(req, opt) {
    var cached = {};

    opt = opt || {};
    var cache_hashes = false || opt.cache;

    var address = req.connection.address();
    var requestOptions = {
        port: address.port,
        host: address.address
    };
    if (opt.headers) {
        requestOptions.headers = opt.headers;
    }

    return function(route, cb) {
        if (!requestOptions.port) {
            return cb(new Error('port not yet configured for fingerprinter'));
        }

        var cache = cached[route];
        if (cache) {
            return cb(null, cache);
        }

        requestOptions.path = route;

        var request = (req.connection.encrypted ? https : http).request(requestOptions, function(res) {
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

