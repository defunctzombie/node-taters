var assert = require('assert');
var fs = require('fs');
var after = require('after');

var path = require('path');

var express = require('express');
var hbs = require('hbs');

var taters = require('../');

suite('exclusion');

var app = undefined;;
var tot = undefined;

before(function(done) {
  app = express();
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.engine('html', hbs.__express);

  tot = taters(app, {
    exclude: ['.js']
  });

  app.use(express.static(__dirname + '/public'));

  done();
});

test('should not hash /index.js via string', function(done) {
  app.render('exclude', function(err, html) {
    assert.ifError(err);
    assert.equal(html, fs.readFileSync(__dirname + '/expected-exclude-js.html', 'utf8'));
    done();
  });
});

test('should not hash /style.css via regex', function(done) {
  tot.opt.exclude = [/.css/];

  app.render('exclude', function(err, html) {
    assert.ifError(err);
    assert.equal(html, fs.readFileSync(__dirname + '/expected-exclude-css.html', 'utf8'));
    done();
  });
});
