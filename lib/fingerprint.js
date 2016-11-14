var walk = require('./walk');

// tag -> attribute for hashable items
var supported = {
    script: 'src',
    link: 'href',
    img: 'src',
};

// fingerprint resources using manager
module.exports = function(opt, hash_provider) {

    // return new url
    function changeme(url, cb) {

        // ignore relative urls or urls with a protocol
        if (url[0] !== '/') {
            return cb(null, url);
        }

        // ignore protocol free external urls
        if (url[1] === '/') {
            return cb(null, url);
        }

        hash_provider(url, function(err, url_hash, hash) {
            if (err) {
                return cb(err);
            }

            var prefix = opt.prefix || '';
            cb(null, prefix + url_hash);
        });
    };

    function onnode(node, cb) {
        if (node.type !== 'tag') {
            return cb();
        }
        var attr_name = supported[node.name];

        // ignore things we don't rewrite for
        if (!attr_name) {
            return cb();
        }

        var orig = node.attributes[attr_name];

        // if there is no original, ignore
        if (!orig) {
            return cb();
        }

        // test if the url should be hashed or not
        if (opt.exclude) {
            const excluded = opt.exclude.some(function (rule) {
                if (typeof rule === 'string' && orig.indexOf(rule) !== -1) {
                    return true;
                } else if (typeof rule === 'object' && rule.test && rule.test(orig)) {
                    return true;
                }
            });

            if (excluded) {
                return cb();
            }
        }

        changeme(orig, function(err, val) {
            if (err) {
                return cb(err);
            }

            // replace current value
            node.attributes[attr_name] = val;
            cb();
        });
    }

    return function(dom, cb) {
        walk(dom, onnode, cb);
    };
};
