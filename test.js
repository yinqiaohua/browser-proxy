var r = require('request');
var fs = require('fs');
var colors = require('colors');
// r('http://test.m.v.qq.com/tvp/z_txvlogin_module.html').pipe(fs.createWriteStream('aaaa.html'))
var zlib = require('zlib');


var u = 'http://vm.gtimg.cn/tencentvideo/txp/js/txplayer.js';
u = 'http://test.m.v.qq.com/tvp/z_txvlogin_module.html';
// u = 'http://video.qq.com/getcookie/getcookie.html.html';

var chunks = [];
r.get({
  url: u,
  headers: {
    'accept-encoding': 'gzip, deflate'
  }
}, function(e,r, body){
  // var encoding = r.headers['content-encoding'];
  // console.log(encoding);
  // var buffer = Buffer.concat(body);
  // zlib.gunzip(buffer, function (err, decoded) {
  //   if (err) {
  //     console.log(err);
  //     return;
  //   }
  //   var data = decoded.toString();
  //   console.log(data);
  // });
  // console.log(body);
}).on('end', function(res){
  var buffer = Buffer.concat(chunks);
  zlib.gunzip(buffer, function (err, decoded) {
    if (err) {
      console.log(err);
      return;
    }
    var data = decoded.toString();
    console.log(data);
  });

}).on('data', function(chunk){
  chunks.push(chunk);
})