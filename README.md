# taters

taters is an automatic resource hashing middleware for [express](http://expressjs.com/);

```javascript
var express = require('express');
var taters = require('taters');

var app = express();

app.set('view engine', 'hbs'); // or jade or whatevs
app.set('views', __dirname + '/views');

// let tater setup the magic
// you don't have to do anything else to get fingerprinting
app.use(taters({ cache: true || false });

// you can now serve static content with the regular static middleware
// no need to set a longer cachetime or anything since taters does that for us
app.use(express.static(__dirname + '/public'));

// render your views as before
// tater will replace script, link, img urls with fingerprinted ones
app.get('/', function(req, res, next) {
    res.render('index');
});
```

## api

### taters(opt, [middleware])

middleware is an optional function which will be called when /static/ middleware is encountered. You can do things like set longer expiries, better cache headers, etc...

By default, taters middleware sets an expiry of 1 year. This lets browsers, proxies, and CDNs cache the resource for a long time since the hash changes when the resource changes.
