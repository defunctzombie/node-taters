var assert = require('assert');
var fs = require('fs');
var express = require('express');
var request = require('request');

var taters = require('../');

suite('cache');

var port;
before(function(done) {

    var app = express();

    app.set('view engine', 'hbs');
    app.set('views', __dirname + '/views');

    taters(app, {
        cache: true
    });

    app.use(express.static(__dirname + '/public'));

    app.get('/', function(req, res) {
        res.render('index');
    });

    var server = app.listen(function() {
        port = server.address().port;
        done();
    });
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
