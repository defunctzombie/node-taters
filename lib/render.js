var Stream = require('stream');

/// return a read stream which will emit html data as written
module.exports = function minime(doc) {

    var stream = new Stream();
    stream.readable = true;

    function write(str) {
        stream.emit('data', str);
    };

    function render(element) {
        switch (element.type) {
        case 'text':
            write(element.data);
            return;
        case 'comment':
            // keep IE conditional comments
            /*
            if (element.data.indexOf('endif') > 0) {
                write('<!--' + element.data + '-->');
            }
            */
            write('<!--' + element.data + '-->');
            return;
        case 'tag':

            write('<' + element.name);

            element.attributes = element.attribs || element.attributes;
            if (element.attributes) {
                Object.keys(element.attributes).forEach(function(key) {
                    write(' ' + key + '="' + element.attributes[key] + '"');
                });
            }

            if (element.void) {
                write('/>');
                return;
            }

            write('>');

            if (element.data) {
                write(element.data);
            }

            element.children.forEach(render);
            write('</' + element.name + '>');
        }
    }

    // render on nexttick to give caller time to connect stream
    process.nextTick(function() {
        if (doc.doctype) {
            write('<!doctype' + doc.doctype + '>');
        }

        doc.root.forEach(render);

        // done rendering
        stream.emit('end');
    });

    return stream;
};
