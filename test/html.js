var assert = require('assert');
var fs = require('fs');
var after = require('after');

var express = require('express');
var request = require('supertest');
var hbs = require('hbs');

var taters = require('../');

suite('html');

var app;

before(function(done) {
    app = express();
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    app.engine('html', hbs.__express);

    taters(app);

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
