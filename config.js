var rules = [
  // {
  //   "regx": ".htmlx",
  //   "localFile": "../google-ip/1ping.data.txt"
  // },

  // {
  //   "indexof": "http://m.v.qq.com/tvp/1.html",
  //   "localFile": "/Users/zoborzhang/test/tvp/edugetinfo.html"
  // },

  // {
  //   "indexof":"http://test.m.v.qq.com/zoborzhang/tvp/livepid.html",
  //   "localFile":"/Users/zoborzhang/test/tvp/livepid.html"
  // }

  // url map to localfile
  // {
  //   "indexof": "http://livew.l.qq.com/livemsg?pf=H5&ad_type=WL",
  //   "localFile": "/Users/zoborzhang/test/ad-xml/wl.xml",
  //   "responseHeaders": {
  //     "Access-Control-Allow-Origin":"http://v.qq.com",
  //     "Access-Control-Allow-Credentials": true
  //   }
  // },

  // {
  //   "indexof": "http://livew.l.qq.com/livemsg?pf=H5&ad_type=WC",
  //   "localFile": "/Users/zoborzhang/test/ad-xml/wc.xml",
  //   "responseHeaders": {
  //     "Access-Control-Allow-Origin":"http://v.qq.com",
  //     "Access-Control-Allow-Credentials": "true"
  //   }
  // },

  // remote path map to local path
  // {
  //   "regxPath": "http://imgcache.qq.com/tencentvideo_v1/tvp/js/([^?]+)",
  //   "localPath": "/Users/zoborzhang/codes/livesvn/javascript/release/tencentvideo_v1/tvp/_debug_/"
  // },
  // {
  //   "indexof": "http://m.v.qq.com/tvp/e_appbanner.html",
  //   "localFile": "../google-ip/1ping.data.txts"
  // }
  // {
  //   "regxPath": "http://qzs.qq.com/tencentvideo_v1/tvp/js/([^?]+)",
  //   "localPath": "/Users/zoborzhang/codes/livesvn/javascript/release/tencentvideo_v1/tvp/_debug_/"
  // },

  // remote path map to local path
  {
    "regxPath": "http://vm.gtimg.cn/tencentvideo/txp/js/([^?]+)",
    "localPath": "/Users/zoborzhang/codes/txplayer/debug/",
    "responseHeaders": {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin":"*"
    }
  },

  // // combo
  {
    "regxCombo": "http://vm.gtimg.cn/c/=/tencentvideo/txp/js/([^?]+)",
    "replacePath": "\/tencentvideo\/txp\/js\/",
    "localPath": "/Users/zoborzhang/codes/txplayer/debug/",
    "responseHeaders": {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin":"*"
    }
  }

  // {
  //   "indexof": "http://h5vv.video.qq.com/getinfo",
  //   "httpResponseCode": "404"
  // },

  // {
  //   "indexof": "http://qzs.qq.com/tencentvideo_v1/tvp/js/tvp.player_v2_txv_vod.js",
  //   "host": "10.123.9.9"
  // }
];

var hosts = function(){
/*

#10.123.9.9 imgcache.qq.com

#10.134.13.46 imgcache.qq.com
#10.134.13.46 vm.gtimg.cn

#10.123.9.9 vm.gtimg.cn
127.0.0.1 v1.qq.com
#10.177.130.230 mfm.video.qq.com

*/
};

var headers = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"
};

var noProxy = [
  'qq.com',
  'oa.com',
  'gtimg.cn',
  'zobor.me2'
];

module.exports = {
  rules: rules,
  hosts: hosts,
  headers: headers,
  noProxy: noProxy
};