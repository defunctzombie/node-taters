var after = require('after');

// call function for ever node in tree
module.exports = function process(nodes, func, cb) {

    // user can choose to not pass a completion function
    cb = cb || function() {};

    if (!Array.isArray(nodes)) {
        func(nodes, function(err) {
            if (err) {
                return cb(err);
            }

            if (nodes.children) {
                return process(nodes.children, func, cb);
            }

            cb();
        });

        return;
    }

    cb = after(nodes.length, cb);
    for (var i=0 ; i<nodes.length ; ++i) {
        process(nodes[i], func, cb);
    }
};

