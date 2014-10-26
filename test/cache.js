// builtin
var assert = require('assert');
var fs = require('fs');

// vendor
var express = require('express');
var request = require('request');

// local
var taters = require('../');

var app = express();

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(taters({
    cache: true
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index');
});

var port;
test('init', function(done) {
    var server = app.listen(done);
    port = server.address().port;
});

test('should prime the cache', function(done) {
    request('http://localhost:' + port, function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, fs.readFileSync(__dirname + '/expected.html', 'utf8'));
        done();
    });
});

test('should use the cache', function(done) {
    request('http://localhost:' + port, function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, fs.readFileSync(__dirname + '/expected.html', 'utf8'));
        done();
    });
});
