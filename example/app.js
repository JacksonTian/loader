var http = require('http');
var connect = require('connect');
var render = require('connect-render');
var Loader = require('loader');

require('response-patch');

var app = connect();
// 模版
app.use(render({
  root: __dirname + '/views',
  layout: false,
  viewExt: '.html',
  helpers: {
    CDN: 'http://h5conf.qiniudn.com',
    Loader: function () {
      return Loader;
    },
    assetsMap: require('./assets.json')
  }
}));

// 解析静态文件
app.use('/assets', connect.static(__dirname + '/assets', { maxAge: 3600000 * 24 * 365 }));

app.use('/', function (req, res) {
  res.render('index');
});

http.createServer(app).listen(3001);
