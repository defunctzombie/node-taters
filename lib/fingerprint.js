var walk = require('./walk');

// tag -> attribute for hashable items
var supported = {
    script: 'src',
    link: 'href',
    img: 'src',
};

// fingerprint resources using manager
module.exports = function(hash_provider) {

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

        hash_provider(url, function(err, hash) {
            if (err) {
                return cb(err);
            }

            cb(null, '/static/' + hash.slice(0, 6) + url);
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
