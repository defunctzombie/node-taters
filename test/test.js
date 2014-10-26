var assert = require('assert');
var fs = require('fs');
var after = require('after');

var express = require('express');
var request = require('request');

var taters = require('../');

var app = express();

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use(taters());

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index');
});

var port;
test('init', function(done) {
    var server = app.listen(done);
    port = server.address().port;
});

test('/index.js', function(done) {
    request('http://localhost:' + port + '/static/0065ad/index.js', function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, 'function foo() {}\n');
        done();
    });
});

test('/style.css', function(done) {
    request('http://localhost:' + port + '/static/746f7b/style.css', function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, 'body {}\n');
        done();
    });
});

test('request for /index.js should 404 because we used an incorrect hash', function(done) {
    request('http://localhost:' + port + '/static/000000/index.js', function(err, res, body) {
        assert.ifError(err);
        assert.equal(res.statusCode, 404);
        done();
    });
});

test('/', function(done) {
    request('http://localhost:' + port, function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, fs.readFileSync(__dirname + '/expected.html', 'utf8'));
        done();
    });
});

test('should properly handle multiple inflight requests to same endpoint', function(done) {
    done = after(2, done);

    request('http://localhost:' + port + '/static/0065ad/index.js', function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, 'function foo() {}\n');
        done();
    });

    request('http://localhost:' + port + '/static/0065ad/index.js', function(err, res, body) {
        assert.ifError(err);
        assert.equal(body, 'function foo() {}\n');
        done();
    });
});
