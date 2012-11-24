# tater

tater is an automatic resource hashing layer for [express](http://expressjs.com/);

```javascript
var express = require('express');

var app = express();

app.set('view engine', 'jade'); // or hbs or whatevs

// let tater setup the magic
// you don't have to do anything else to get fingerprinting
app.use(tater(app, { cache: true || false }, function(req, res, next) {

    // req.url is now your regular url
    // you can set cache control and other response options here
    // this is only executed if the /static/ fingerprinted route is hit
    res.header('Cache-Control'. 'public, max-age=31536000');
    next();
});

// render your views as before
// tater will replace script, link, img urls with fingerprinted ones
app.get('/', function(req, res, next) {
    res.render('index');
});
```
