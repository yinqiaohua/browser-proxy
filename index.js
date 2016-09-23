/**
 * @author zobrzhang
 * @copyright 2016
 * @description a proxy for mac browser
 * @source https://github.com/zobor/browser-proxy
 */

var http = require('http');
var https = require('https');
var r = require('request');
var R = require('request');
var net = require('net');
var fs = require('fs');
var extend = require('node.extend');
var URL = require('url');
var AppPort = '8989';
var os = require('os');
var util = require('./common/util');
var dns = require('dns');
var config = {};
var colors = require('colors');
var path = require('path');
var chokidar = require('chokidar');

util.showLog([
  [
    '',
    '',
    '---------- READ ME ----------',
    'Externel Proxy Setting:'.bold,
    'export http_proxy_browser=http://example.com:port'.underline,
    'app support config:'.bold,
    '* browser-proxy -p 8888'.underline,
    '* browser-proxy -c ./config.js'.underline,
    '---------- READ ME ----------\n\n',
    ''
  ].join('\n')
, 'green']);

if (process.env.http_proxy_browser) {
  R = R.defaults({'proxy':process.env.http_proxy_browser});
  util.showLog(['[Info] Current Extenal Proxy:', 'red'],[ process.env.http_proxy_browser, 'red.underline'])
}

var httpServer;
var httpsServer;
var INTERNAL_HTTPS_PORT;
var HTTPS_KEY = path.join(__dirname, 'data', 'key.pem');
var HTTPS_CERT = path.join(__dirname, 'data', 'cert.pem');
var configFilePath = './config.js';


// ----------------- socket.io -----------------
var Msg;
(function(){


var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(9000);

function handler (req, res) {
  var filepath;
  if (req.url.indexOf('/')===0) {
    filepath = req.url;
  }else{
    return;
  }

  fs.readFile(__dirname + '/pannel' + filepath,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
  Msg = socket;
});

})();

// ----------------- socket.io -----------------

// 监听配置文件变化
function watchConfigUpdate(options){
  options = options || {};
  if(options.configPath){
    configFilePath = options.configPath;
  }
  util.showLog(['Browser Proxy Watching Config:', 'gray'], [path.resolve(configFilePath), 'underline.gray']);
  // 加载配置
  config = require(configFilePath);
  parseHost();
  var watcher = chokidar.watch(configFilePath, {
    ignored: /[\/\\]\./,
    persistent: true
  });
  watcher
  .on('change', function(path) {
    util.showLog(['File', 'gray'], [path, 'bold.green'], ['Has Changed', 'gray']);
    delete require.cache[require.resolve(configFilePath)]
    config = require(configFilePath);
    parseHost();
  })
  .on('ready', function() {});
  hasWatched = true;
}


function startServer(options){
  options = options || {};
  AppPort = options['-p'] || AppPort;
  watchConfigUpdate({
    configPath: options['-c']
  });
  createHttpServer({
    AppPort: AppPort
  });
  createHttpsServer();
}

function createHttpServer(options){
  httpServer = http.createServer(function(req, res){
    app(req, res);
  });
  httpServer.listen(options.AppPort);
  util.showLog(['Txplayer Browser Debug Proxy: ', 'green'], ['http://127.0.0.1:'+options.AppPort, 'red.underline']);
}

function createHttpsServer(){
  httpsServer = https.createServer({
    key: fs.readFileSync(HTTPS_KEY),
    cert: fs.readFileSync(HTTPS_CERT)
  }, function(req, res){
    req.type = 'https';
    app(req, res);
  });
  httpsServer.on('listening', function(){
    INTERNAL_HTTPS_PORT = httpsServer.address().port;
  });
  httpsServer = httpsServer.listen(INTERNAL_HTTPS_PORT);

  proxyHttps();
}

function GUID(len){
  len = len || 32;
  var guid = "";
  for (var i = 1; i <= len; i++) {
    var n = Math.floor(Math.random() * 16.0).toString(16);
    guid += n;
  }
  return guid;
}

function app(req, res){
  // 处理https req.url
  if (req.type==='https') {
    req.url = 'https://' + req.headers.host + req.url;
  }
  // 返回 http://127.0.0.1:port html页面，提供安装证书入口
  if (req.url==='/') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end([
      '<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,minimal-ui" />',
      '<h2>hello browser proxy</h2>',
      '<p>Install Certificate <a href="/cert.pem">Click Here</a></p>',
      '<p>Request Panel <a href="/pannel/">Click Here</a></p>',
    ].join(''));
    return;
  }

  if ( req.headers.host.indexOf('127.0.0.1')===0 && req.url.indexOf('/pannel/')===0 ) {
    if (req.url==='/pannel/') {
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end( fs.readFileSync('pannel/index.html', 'utf-8') );
      return;
    }else{
      var fnRegx = /\/pannel\/([^\?]+)/;
      var fnRet = fnRegx.exec(req.url);
      if (fnRet && fnRet[1]) {
        fnRet[1] = 'pannel/' + fnRet[1];
        res.end( fs.readFileSync(fnRet[1], 'utf-8') );
        return;
      }
    }
  }

  var sid = GUID();


  // 证书下载链接
  if (req.url==='/cert.pem') {
    res.writeHead(200, {'Content-Type':'application/octet-stream'});
    res.end( fs.readFileSync('./data/cert.pem') );
    return;
  }

  if (Msg && Msg.emit) {
    Msg.emit('request', {
      url: req.url,
      id: sid,
      headers: req.headers
    });
  }

  var inRules = false;
  var urlParse = URL.parse(req.url);
  if (!config.rules || config.rules.constructor!==Array) {
    util.showLog(['Proxy Rule is Empty!', 'red']);
    return;
  }

  // 规则匹配
  config.rules.forEach(function(item, idx){
    if (inRules) return;
    var isMatch;
    var content;
    var regx;
    var localFile;
    var matchFiles;
    var resHeaders = {};
    var tmp;
    var _matchFiles = [];
    var isFileExist = true;
    var basePath='';
    // 正则匹配
    if (item.regx) {
      if (typeof item.regx==='string'){
        item.regx = item.regx.replace(/\//g,'\/').replace(/\./g,'\.');
        item.regx = new RegExp(item.regx, 'ig');
      }
      isMatch = item.regx.test(req.url);
    }
    // indexOf 查找
    else if(item.indexof){
      isMatch = req.url.indexOf(item.indexof) > -1;
    }
    // 正则匹配URL目录
    else if(item.regxPath){
      regx = item.regxPath.replace(/\//g,'\/').replace(/\./g,'\.');
      regx = new RegExp(regx, 'ig');
      isMatch = regx.test(req.url);
    }
    // 文件合并服务
    else if(item.regxCombo){
      regx = item.regxCombo.replace(/\//g,'\/').replace(/\./g,'\.');
      regx = new RegExp(regx, 'ig');
      isMatch = regx.test(req.url);
      matchFiles = RegExp.$1.replace(new RegExp(item.replacePath, 'ig') || '', '');
      if (matchFiles){
        matchFiles = matchFiles.split(',');
        if (matchFiles && matchFiles.length){
          basePath = matchFiles[0].split('/');
          basePath.pop();
          basePath = basePath.join('/') + '/';
        }
        _matchFiles = [];
        matchFiles.forEach(function(filename, idx){
          if (idx>0){
            _matchFiles.push(item.localPath + basePath + filename);
          }else{
            _matchFiles.push(item.localPath + filename);
          }
        });
        matchFiles = _matchFiles;
      }
    }
    if (!isMatch) return;
    inRules = true;

    // 本地文件
    if (item.localFile){
      isFileExist = fs.existsSync(item.localFile);
      if (isFileExist){
        content = fs.readFileSync(item.localFile, 'utf-8');
      }
    }
    // 本地路径 + 匹配到的文件名
    if (item.localPath && RegExp.$1) {
      localFile = item.localPath + RegExp.$1;
      isFileExist = fs.existsSync(localFile);
      if (isFileExist){
        content = fs.readFileSync(localFile, 'utf-8');
      }
    }
    // 合并服务
    if (item.regxCombo && item.localPath && matchFiles && matchFiles.length) {
      content = [];
      matchFiles.forEach(function(filepath, idx){
        content.push( fs.readFileSync(filepath, 'utf-8') );
      });
      content = content.join('');
    }

    // 默认设置header
    if (config.defaultHeaders) {
      resHeaders = extend(resHeaders, config.defaultHeaders);
    }
    // 返回的请求头
    if (item.responseHeaders) {
      resHeaders = extend(resHeaders, item.responseHeaders);
    }
    // 指定返回http code
    if (item.httpResponseCode) {
      res.writeHead(item.httpResponseCode, resHeaders);
      res.end();
    }
    // 代理到本地文件
    else if (content) {
      // Match Rule Color Theme
      util.showLog(
        [util.dateFormat(), 'green'],
        [req.method, 'green'],
        [req.url, 'yellow.underline']
      );
      res.writeHead(item.httpResponseCode || 200, resHeaders);
      if (item && item.useJSONPCallback) {
        var jsonpcallback = getUrlParam('callback', req.url);
        if (jsonpcallback) {
          content = jsonpcallback + '(' + content + ')';
        }
      }
      res.end(content);
    }
    // 代理到本地文件不存在
    else if(!isFileExist){
      util.showLog(
        [util.dateFormat(), 'red'],
        [req.method, 'red'],
        ['[local file not found]', 'red'],
        [req.url, 'red.underline']
      );
      res.writeHead(404, resHeaders);
      res.end();
    }
    // 请求url并返回
    else{
      sendRequest(req, res, urlParse, item);
    }
  });

  if (!inRules){
    sendRequest(req, res, urlParse, null, config.defaultHeaders);
  }
}


// do request action
function sendRequest(req, res, urlParse, item, headers){
  item = item || {};
  headers = headers || {};
  var request = r, useHOST = false;
  // in noProxy or in hosts
  if ( config.noProxy.indexOf( util.getTopDomain(urlParse.hostname) )>-1 ||
    config.hosts[urlParse.hostname]
  ) {
    request = r;
  }else{
    request = R;
  }
  var requestConfig = {
    url: req.url,
    headers: req.headers,
    timeout: 10000
  };
  // replace remote url
  if (item.remoteUrl) {
    requestConfig.url = item.remoteUrl;
  }
  // set request host
  if (config.hosts[urlParse.hostname]) {
    requestConfig.hostname = config.hosts[urlParse.hostname];
    useHOST = true;
  }
  if (item.host) {
    requestConfig.hostname = item.host;
    useHOST = true;
  }
  if (!useHOST) {
    dns.lookup(urlParse.hostname, function(err, addresses, family){
      requestConfig.hostname = addresses;
    });
  }
  if (config.defaultHeaders && config.defaultHeaders['User-Agent']){
    requestConfig.headers['User-Agent'] = config.defaultHeaders['User-Agent'];
  }

  if (req.url.indexOf('livew.l.qq.com')>-1 ) {
    console.log(requestConfig);
  }
  if (req.method === 'GET') {
    request.get(requestConfig, function(err,response, body){
      requestHandler({
        req: req,
        err: err,
        response: response,
        body: body,
        useHOST: useHOST,
        requestConfig: requestConfig,
        colors: item.colors
      });
    })
    .pipe(res)
  }else{
    // get post body
    var postBody = [];
    req.on('data', function (chunk) {
      postBody.push(chunk);
    });
    req.on('end', function () {
      requestConfig.form = postBody.join('');
      request.post(requestConfig, function(err,response, body){
        requestHandler({
          req: req,
          err: err,
          response: response,
          body: body,
          useHOST: useHOST,
          requestConfig: requestConfig
        });
      }).pipe(res)
    });
  }
}

function proxyHttps(){
  httpServer.on('connect', function(req, socket, upgradeHead){
    var netClient = net.createConnection(INTERNAL_HTTPS_PORT);

    netClient.on('connect', function(){
      socket.write( "HTTP/1.1 200 Connection established\r\nProxy-agent: Netscape-Proxy/1.1\r\n\r\n");
      // console.log(req.url);
    });

    socket.on('data', function(chunk){
      netClient.write(chunk);
    });
    socket.on('end', function(){
      netClient.end();
    });
    socket.on('close', function(){
      netClient.end();
    });
    socket.on('error', function(err){
      console.error('socket error ' + err.message);
      netClient.end();
    });

    netClient.on('data', function(chunk){
      socket.write(chunk);
    });
    netClient.on('end', function(){
      socket.end();
    });
    netClient.on('close', function(){
      socket.end();
    });
    netClient.on('error', function(err){
      console.error('netClient error ' + err.message);
      socket.end();
    });
  });
};


// request done
function requestHandler(options){
  // filter
  if (config && config.filter && config.filter.length) {
    if ( config.filter.indexOf(options.req.headers.host)===-1 ) {
      return;
    }
  }
  options = options || {};
  if (options.err) {
    if (options.err.code === 'ETIMEDOUT' && options.err.connect === true){
      util.showLog(
        [util.dateFormat(), 'red'],
        [options.req.method, 'red'],
        [options.err.code, 'red'],
        [options.req.url, 'red']
      );
    }
  }else{
    options.response.statusCode = (options.response.statusCode+'') || '';
    if ( /^4/.test(options.response.statusCode) || /^5/.test(options.response.statusCode) ){
      util.showLog(
        [util.dateFormat(), 'red'],
        [options.req.method, 'red'],
        [options.response.statusCode, 'red'],
        [options.req.url, 'red']
      );
    }else{
      if (options.colors) {
        util.showLog(
          [util.dateFormat(), options.colors],
          [options.req.method, options.colors],
          [options.response.statusCode, options.colors],
          [options.req.headers.host, options.colors],
          [options.requestConfig.hostname||'',options.colors],
          [options.req.url, options.colors]
        );
        function decodeShowUrlParam(a){
          var b = URL.parse(a);
          if (!b || !b.query) return;
          var c = b.query.split('&').join('\n');
          var d = decodeURIComponent( c );
          util.showLog([d, options.colors]);
        }
        decodeShowUrlParam(options.req.url);
      }
      else if (options.useHOST) {
        util.showLog(
          [util.dateFormat(), 'green'],
          [options.req.method, 'green'],
          [options.response.statusCode, 'green'],
          [options.req.headers.host, 'blue.bold.underline'],
          [options.requestConfig.hostname||'','blue.bold.underline'],
          [options.req.url, 'blue.bold.underline']
        );
      }else{
        util.showLog(
          [util.dateFormat(), 'green'],
          [options.req.method, 'green'],
          [options.response.statusCode, 'green'],
          [options.req.headers.host, 'gray.bold'],
          [options.requestConfig.hostname||'','gray.bold.underline'],
          [options.req.url, 'gray']
        );
      }
    }
  }
}

function getUrlParam(p, u) {
  var reg = new RegExp("(^|&|\\\\?)" + p + "=([^&]*)(&|$|#)"),
    r = null;
  r = u.match(reg);
  if (r) {
    return r[2];
  }
  return "";
}

function parseHost(){
  hostText = util.getCodeFromNote(config.hosts);
  config.hosts = {};
  // parse hosts string
  hostText.split('\n').forEach(function(h, idx){
  var _hostName = null;
    h.split(/\s/).reverse().forEach(function(v, k){
      if (!v) return;
      if (v.indexOf('#')>-1) return;
      if (!_hostName){
        _hostName = v;
      }else{
        config.hosts[_hostName] = v;
      }
    });
  });
  util.showLog(
    ['Browser Proxy Hosts:', 'yellow'],
    [JSON.stringify(config.hosts), 'yellow.underline']
  );
}

process.on('uncaughtException', function(err){
  console.error('uncaughtException: ' + err.message);
});

module.exports = startServer;