var assert = require('assert');
var fs = require('fs');
var after = require('after');

var express = require('express');
var request = require('supertest');
var hbs = require('hbs');

var taters = require('../');

suite('html');

var app = undefined;;
var tot = undefined;

before(function(done) {
    app = express();
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    app.engine('html', hbs.__express);

    tot = taters(app);

    app.use(express.static(__dirname + '/public'));
    app.get('/', function(req, res) {
        res.render('index');
    });
    done();
});

test('/', function(done) {
    request(app).get('/').end(function(err, res) {
        assert.ifError(err);
        assert.equal(res.text, fs.readFileSync(__dirname + '/index.html', 'utf8'));
        done();
    });
});

test('should support .hash function to hash a url', function(done) {
    tot.hash('/index.js', function(err, hash_url, hash) {
        assert.ifError(err);
        assert.equal(hash_url, '/static/0065ad/index.js');
        assert.equal(hash, '0065ad');
        done();
    });
});

test('should have no hash for 404 resources', function(done) {
    tot.hash('/notfound.js', function(err, hash_url, hash) {
        assert(err);
        assert.equal(err.status, 404);
        done();
    });
});
