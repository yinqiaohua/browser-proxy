var rules = [

  // 代理静态文件到本地
  {
    "regx": "http://m.v.qq.com/tvp/index.html",
    "localFile": "/path/to/local/file/index.html"
  },

  // 代理远程目录到本地目录
  {
    "regx": "http://m.v.qq.com/tvp/([^?]+)",
    "localPath": "/path/to/local/file/"
  },

  // 添加请求返回头
  {
    "regx": "http://m.v.qq.com/tvp/index.html",
    "localFile": "/path/to/local/file/index.html",
      "responseHeaders": {
      "Access-Control-Allow-Origin":"http://v.qq.com",
      "Access-Control-Allow-Credentials": true
    }
  },

  // Combo服务代理
  {
    "regxCombo": "http://vm.gtimg.cn/c/=/tencentvideo/txp/js/([^?]+)",
    "replacePath": "\/tencentvideo\/txp\/js\/",
    "localPath": "/path/to/local/folder/"
  },

  // 代理远程url到另外一个url
  {
    remoteUrl: 'http://vm.gtimg.cn/tencentvideo/script/vplay/variety/vplay.variety_797c94.min.js',
    indexof: 'http://vm.gtimg.cn/tencentvideo/script/vplay/variety/vplay.variety_3447d4.min.js'
  },

  // cdn合并请求代理到本地文件夹
  {
    "regxPath": "http://vm.gtimg.cn/tencentvideo/txp/js/([^?]+)",
    "localPath": "/path/to/local/file/"
  },

  // cgi 404 模拟
  {
    "indexof": 'http://cgi.qq.com/do?',
    "httpResponseCode": "404"
  },

  // cgi jsonp
  {
    "indexof": 'http://cgi.qq.com/do?',
    "localFile": "/path/to/local/file/do.json",
    "useJSONPCallback": true
  },

  // 单请求配置host
  {
    "indexof": "http://qzs.qq.com/tencentvideo_v1/tvp/js/tvp.player_v2_txv_vod.js",
    "host": "10.123.9.9"
  }
];

var hosts = function(){
/*

#127.0.0.1 vm.gtimg.cn
127.0.0.1 qzs.qq.com

*/
};

var headers = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"
};

var noProxy = [
  'qq.com',
  'gtimg.cn'
];

var filter = [
  'imgcache.qq.com'
];

module.exports = {
  rules: rules,
  hosts: hosts,
  headers: headers,
  filter: filter,
  noProxy: noProxy
};