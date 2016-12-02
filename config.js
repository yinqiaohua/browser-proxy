module.exports = {
  pac: '/Users/zoborzhang/test/proxy.pac',
  rules: [
    {
      regx: '^https?://v.qq.com/txplayer/index.html',
      localFile: '/Users/zoborzhang/codes/txplayer/demo/apis.html'
    },
    {
      regx: '^https?://v.qq.com/iframe/h5player.html',
      localFile: '/Users/zoborzhang/svn/v2_trunk/livesvn/javascript/dev/TenVideoPlayer_V2/toolpages/iframe-jd/h5player.html'
    },
    // {
    //   regx: 'http://test.m.v.qq.com/tvp/y_cnd_player_v2_txv_vod.html',
    //   localFile: '/Users/zoborzhang/svn/v2_trunk/livesvn/javascript/dev/TenVideoPlayer_V2/demos/y_cnd_player_v2_txv_vod.html'
    // },
    {
      regx: 'http://imgcache.qq.com/tencentvideo_v1/tvp/js/([^?]+)',
      localPath: '/Users/zoborzhang/svn/v2_trunk/livesvn/javascript/release/tencentvideo_v1/tvp/_debug_/'
    },
    // {
    //   regx: '^https?://v.qq.com/iframe/h5player.html',
    //   host: '10.136.1.179'
    //   // localFile: '/Users/zoborzhang/svn/v2_trunk/livesvn/javascript/dev/TenVideoPlayer_V2/toolpages/iframe-jd/h5player.html'
    // },
    // {
    //   regx: '^https?://livew.l.qq.com/livemsg\\?pf=H5&ad_type=WL&pf_ex=',
    //   // httpStatus: 404
    //   jsonp: '/Users/zoborzhang/test/jsonp/livew3.json'
    // },
    // {
    //   regx: '^https?://livew.l.qq.com/livemsg\\?pf=H5&ad_type=WH&pf_ex=',
    //   jsonp: '/Users/zoborzhang/test/jsonp/livew0.json'
    // },
    // {
    //   regx: '^https?://livew.l.qq.com/livemsg\\?pf=H5&ad_type=WH&pf_ex=mac',
    //   jsonp: '/Users/zoborzhang/test/jsonp/livew1.json'
    // },
    // {
    //   regx: '^https?://livew.l.qq.com/livemsg\\?pf=H5&ad_type=WC&pf_ex=mac',
    //   jsonp: '/Users/zoborzhang/test/jsonp/WC.json'
    // },
    // {
    //   regx: '^http://h5vv.video.qq.com/getinfo\\?callback=',
    //   jsonp: '/Users/zoborzhang/test/jsonp/getinfo.json'
    // },
    // {
    //   regx: '^http://h5vv.video.qq.com/getkey\\?callback=',
    //   jsonp: '/Users/zoborzhang/test/jsonp/getinfo_err.json'
    // },
    // {
    //   regx: '^https?://ca.gtimg.com/adplugin/js/adplayer.js',
    //   // httpStatus: 404
    //   host: '10.240.108.12'
    // },

    // 播放页txplayer
    // {
    //   regx: /^https?:\/\/vm\.gtimg\.cn\/tencentvideo\/txp\/js\/([^?]+)/i,
    //   localPath: '/Users/zoborzhang/codes/txplayer/debug/',
    //   responseHeaders: {
    //     "Content-Type": "application/javascript",
    //     "Access-Control-Allow-Origin":"*"
    //   }
    // },
    // {
    //   regx: 'http://vm.gtimg.cn/c/=([^?]+)',
    //   indexof: '/tencentvideo/txp/js/plugins/',
    //   comboMaps: {
    //     '/tencentvideo/txp/js/': '/Users/zoborzhang/codes/txplayer/debug/',
    //     '/tencentvideo/txp/js/plugins/': '/Users/zoborzhang/codes/txplayer/debug/plugins/',
    //     '/tencentvideo_v1/3party/': '/Users/zoborzhang/codes/release/tencentvideo_v1/3party/'
    //   },
    //   responseHeaders: {
    //     "Content-Type": "application/javascript",
    //     "Access-Control-Allow-Origin":"*"
    //   }
    // },
    // // v首的combo
    // {
    //   regx: 'http://vm.gtimg.cn/c/=([^?]+)',
    //   indexof: '/tencentvideo_v1/script/txv.core.js',
    //   comboMaps: {
    //     '/tencentvideo/txp/js/': '/Users/zoborzhang/codes/txplayer/debug/',
    //     '/tencentvideo_v1/script/': '/Users/zoborzhang/codes/release/tencentvideo_v1/script/',
    //   },
    //   responseHeaders: {
    //     "Content-Type": "application/javascript",
    //     "Access-Control-Allow-Origin":"*"
    //   }
    // },

    // {
    //   regx: /^https?:\/\/vm\.gtimg\.cn\/tencentvideo\/txp\/js\/([^?]+)/i,
    //   localPath: '/Users/zoborzhang/codes/txplayer/release/',
    //   responseHeaders: {
    //     "Content-Type": "application/javascript",
    //     "Access-Control-Allow-Origin":"*"
    //   }
    // },
    // {
    //   regx: 'http://vm.gtimg.cn/c/=([^?]+)',
    //   indexof: '/tencentvideo/txp/js/plugins/',
    //   comboMaps: {
    //     '/tencentvideo/txp/js/': '/Users/zoborzhang/codes/txplayer/release/',
    //     '/tencentvideo/txp/js/plugins/': '/Users/zoborzhang/codes/txplayer/release/plugins/',
    //   },
    //   responseHeaders: {
    //     "Content-Type": "application/javascript",
    //     "Access-Control-Allow-Origin":"*"
    //   }
    // },

    // {
    //   regx: /.*\.mp4\?/i,
    //   httpStatus: 502
    // },
    // {
    //   regx: 'https?://livew.l.qq.com/livemsg',
    //   httpStatus: 500
    // },
    // {
    //   regx: /^https?:\/\/vm\.gtimg\.cn\/tencentvideo\/txp\/js\/([^?]+)/i,
    //   host: '10.134.13.46'
    // },
    {
      regx: '^https?://vm.gtimg.cn',
      // regx: /^https?:\/\/vm\.gtimg\.cn\/tencentvideo\/txp\/js\/([^?]+)/i,
      host: '10.136.1.179'
      // host: '10.136.1.179'
    },
    // {
    //   regx: '^https?://m.v.qq.com',
    //   host: '10.121.137.21'
    // },
    // {
    //   regx: '^http://183.60.23.19/vmind.qqvideo.tc.qq.com/p0200xb7u6s.p202.1.mp4',
    //   httpStatus: 404
    // },
    // {
    //   regx: /test\.js/i,
    //   requestInterceptor: function(req, res){
    //     res.end('hello world');
    //   }
    // },
  ]
}