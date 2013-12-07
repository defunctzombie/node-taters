# taters [![Build Status](https://travis-ci.org/defunctzombie/node-taters.png?branch=master)](https://travis-ci.org/defunctzombie/node-taters)

taters is an automatic resource hashing middleware for [express](http://expressjs.com/). Injects resource fingerprints into static resource urls. Optionally inject a prefix for CDN deployments.

### before
```html
<head>
    <link href="/css/style.css">
</head>
<body>
    <script src="/js/index.js"></script>
</body>
```

### after
```html
<head>
    <link href="/static/1db360/css/style.css">
</head>
<body>
    <script src="/static/e9038a/js/index.js"></script>
</body>
```

And taters will add the appropriate cache expiry headers.

## quickstart

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

## options

Taters accepts some options to configure behavior

| option | type | default | description |
| ---- | ---- | ---- | ---- |
| cache | Boolean | false | `true` will cache url hashes to be cached |
| prefix | String |  | prefix all changed url with this path |

## CDN

Taters makes it very easy to use a CDN in production. Simply set the `prefix` option to the domain of your CDN and your resources will be served via CDN.
