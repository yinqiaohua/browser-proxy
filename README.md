# bproxy

## UI界面
![Alt text](./images/pannel.png 'UI界面')

## 前端调试的代理调试工具
* 代理到本地文件
* 支持host设置（支持单个请求host）
* 代理到url
* 文件合并
* 修改配置立即生效
* 基于nodejs，支持windows, mac, linux
* 添加response headers


## install and start app
```
sudo npm install bproxy -g

// start browser proxy with default port
bproxy

// set port & start bproxy
bproxy -p 8989

// use local config
mkdir -p /Users/zoborzhang/config/
cd /Users/zoborzhang/config/
touch config.js
edit config.js with follow code:

  module.exports = {
    rules: [
      // map to localfile
      {
        regx: '^https?://v.qq.com/welcome.html',
        localFile: './welcome.html',
      }
    ],
    disable_cache: true,
    disable_gzip: true
  }
now start: bproxy
```

## 启动UI界面，浏览器打开

[http://localhost:9000](http://localhost:9000)

## 代理规则

`代理规则参考config.js`

### >> 代理请求到本地文件
```
{
	regx: '^https?://v.qq.com/welcome.html',
	'localFile': '/path/to/local/index.html'
}
```
### >> 代理请求到本地目录
```
{
  'regx': 'http://imgcache.qq.com/tencentvideo_v1/tvp/js/([^?]+)',
  'localPath': '/path/to/local/'
}
```
### >> 代理文请求添加responseHeaders
```
{
  'regxPath': 'http://imgcache.qq.com/tencentvideo_v1/tvp/js/([^?]+)',
  'localPath': '/path/to/local/',
	'responseHeaders': {
		'Access-Control-Allow-Origin':'http://v.qq.com',
		'Access-Control-Allow-Credentials': 'true'
	}
}
```
### >> cdn合并请求代理
```
{
  'regx': 'http://vm.gtimg.cn/c/=/tencentvideo/txp/js/([^?]+)',
  'comboMaps': {
    '/tencentvideo/txp/js/': '/path/to/local/',
  }
}
```
### >> 支持cgi jsonp
```
{
  'indexof': 'http://vm.gtimg.cn/tencentvideo/txp/js/txplayer.json',
  'jsonp': '/path/to/local/txplayer.json'
}
```
### >> 指定返回http status code
```
{
  'regx': 'http://vm.gtimg.cn/tencentvideo/txp/js/txplayer.js',
  'httpStatus': '404'
}
```
### >> 单个请求指定hosts
```
{
  'regx': 'http://vm.gtimg.cn/tencentvideo/txp/js/txplayer.js',
  'host': '127.0.0.1'
}
```

## 安装证书：
### On MacOS
cd /usr/local/lib/node_modules/browser-proxy/
sh install_certificate.sh

### On Android or IOS
visit http://ip:9000/install

### On Windows
visit http://ip:9000/install and download certificate
double click to install
