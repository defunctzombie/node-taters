var assert = require('assert');
var fs = require('fs');
var express = require('express');
var request = require('request');

var taters = require('../');

suite('cdn');

var port;

before(function(done) {

    var app = express();

    app.set('view engine', 'hbs');
    app.set('views', __dirname + '/views');

    taters(app, {
        prefix: '//cdn.example.com'
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

// fetch html first to test loading from cold cache
test('should fetch / with cold cache', function(done) {
    request('http://localhost:' + port, function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, fs.readFileSync(__dirname + '/expected-cdn.html', 'utf8'));
        done();
    });
});

test('should fetch /index.js', function(done) {
    request('http://localhost:' + port + '/static/0065ad/index.js', function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, 'function foo() {}\n');
        done();
    });
});

test('should fetch /style.css', function(done) {
    request('http://localhost:' + port + '/static/746f7b/style.css', function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, 'body {}\n');
        done();
    });
});
