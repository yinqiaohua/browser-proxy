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
var zlib = require('zlib');

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
  util.showLog(['[Info] Current Extenal Proxy:', 'green'],[ process.env.http_proxy_browser, 'green.underline'])
}

var httpServer;
var httpsServer;
var INTERNAL_HTTPS_PORT;
var HTTPS_KEY = path.join(__dirname, 'data', 'key.pem');
var HTTPS_CERT = path.join(__dirname, 'data', 'cert.pem');
var configFilePath = './config.js';


// ----------------- socket.io -----------------
// UI面板
var Msg;
(function(){


var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(9000);

function handler (req, res) {
  var filepath;
  if (req.url==='/') {
    req.url = '/index.html';
  }
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
  util.showLog(['Browser Proxy Watching Config:', 'green'], [path.resolve(configFilePath), 'underline.gray']);
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


// 入口
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

// 创建代理服务器－http
function createHttpServer(options){
  httpServer = http.createServer(function(req, res){
    app(req, res);
  });
  httpServer.listen(options.AppPort);
  util.showLog(['Txplayer Browser Debug Proxy: ', 'green'], ['http://127.0.0.1:'+options.AppPort, 'gray.underline']);
}

// 创建代理服务器－https
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

  var sid = GUID();
  req.__sid__ = sid;


  // 证书下载链接
  if (req.url==='/cert.pem') {
    res.writeHead(200, {'Content-Type':'application/octet-stream'});
    res.end( fs.readFileSync('./data/cert.pem') );
    return;
  }

  // delte 清除缓存
  delete req.headers['cache-control'];
  delete req.headers['if-modified-since'];
  delete req.headers['if-none-match'];

  // delete gzip
  delete req.headers['accept-encoding'];
  var urlParse = URL.parse(req.url, true);
  if (Msg && Msg.emit) {
    Msg.emit('request', {
      url: req.url,
      id: sid,
      query: urlParse.query,
      method: req.method,
      reqHeaders: req.headers,
      reqStartTime: (+new Date)
    });
  }

  var inRules = false;
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
    var itemRegx, itemRegxStr;
    // 正则匹配
    if (item.regx) {
      if (typeof item.regx==='string'){
        itemRegxStr = item.regx.replace(/\//g,'\/').replace(/\./g,'\.');
        itemRegx = new RegExp(itemRegxStr, 'ig');
        isMatch = itemRegx.test(req.url);
      }else{
        isMatch = item.regx.test(req.url);
      }
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
      }else{
        // 404 error
      }
    }
    // 本地路径 + 匹配到的文件名
    if (item.localPath && RegExp.$1) {
      localFile = item.localPath + RegExp.$1;
      isFileExist = fs.existsSync(localFile);
      if (isFileExist){
        content = fs.readFileSync(localFile, 'utf-8');
      }else{
        // 404 error
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
      // res.writeHead(item.httpResponseCode, resHeaders);
      // res.end();
      handlerLocalResponse({
        res: res,
        req: req,
        responseBody: content,
        httpResponseCode: item.httpResponseCode,
        responseHeaders: resHeaders
      });
    }
    // 代理到本地文件
    else if (content) {
      // Match Rule Color Theme
      // res.writeHead(item.httpResponseCode || 200, resHeaders);
      if (item && item.useJSONPCallback) {
        var jsonpcallback = util.getUrlParam('callback', req.url);
        if (jsonpcallback) {
          content = jsonpcallback + '(' + content + ')';
        }
      }
      // res.end(content);
      handlerLocalResponse({
        res: res,
        req: req,
        responseBody: content,
        httpResponseCode: item.httpResponseCode || 200,
        responseHeaders: resHeaders
      });
    }
    // 代理到本地文件不存在
    else if(!isFileExist){
      // res.writeHead(404, resHeaders);
      // res.end();
      handlerLocalResponse({
        req: req,
        res: res,
        responseBody: null,
        httpResponseCode: 404,
        responseHeaders: resHeaders
      });
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


function handlerLocalResponse(options){
  options.res.writeHead(options.httpResponseCode, options.responseHeaders);
  if (options.responseBody) {
    options.res.end(options.responseBody);
  }else{
    options.res.end();
  }
  var emitData = {
    sid: options.req.__sid__,
    url: options.req.url,
    resHeaders: options.responseHeaders,
    body: options.responseBody,
    statusCode: options.httpResponseCode,
    mapLocal: true
  };
  responseEmit(emitData);
}

function responseEmit(data){
  var param = {};
  param.sid = data.sid;
  if (data.res && data.res.headers) {
    param.resHeaders = data.res.headers;
  }
  if (data.body) {
    param.body = data.body;
  }
  param.useHOST = data.useHOST;
  param.mapLocal = data.mapLocal;
  param.hostname = data.hostname;
  param.reqEndTime = (+new Date);
  param.postBody = data.postBody;
  param.statusCode = data.statusCode;
  if (Msg && Msg.emit) {
    Msg.emit('response', param);
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

  var chunks = [];

  var showResponseText = function(headers){
    if (headers &&
      headers['content-type'] &&
      /text|html|xhtml|css|javascript|json|xml/i.test(headers['content-type'])
      && !/svg|image|mp4|video|png|gif|shockwave-flash/i.test(headers['content-type'])
    ) {
      return true;
    }
    return false;
  }
  var emitData = function(response, body, postBody){
    var _data = {};
    _data.res = response;
    _data.sid = req.__sid__;
    if (body) _data.body = body;
    _data.useHOST = !!useHOST;
    _data.hostname = requestConfig.hostname;
    _data.postBody = postBody;
    _data.statusCode = response.statusCode;
    responseEmit(_data);
  };
  if (req.method === 'GET') {
    // console.log('GET ' + req.url);
    request.get(requestConfig, function(err,response, body){
      if (err || !(response && response.headers) ) return;
      if ( showResponseText(response.headers) ) {
        // 解压zip
        if (response.headers['content-encoding']==='gzip') {
          var buffer = Buffer.concat(chunks);
          zlib.gunzip(buffer, function (err, decoded) {
            if (err) {
              return;
            }
            var data = decoded.toString();
            emitData(response, data, null);
          });
        }else{
          emitData(response, body, null);
        }
      }
      else{
        emitData(response, '', null);
      }
    })
    .on('data', function(chunk){
      chunks.push(chunk);
    })
    .pipe(res);
  }else{
    // get post body
    var postBody = [];
    req.on('data', function (chunk) {
      postBody.push(chunk);
    });
    req.on('end', function () {
      requestConfig.form = postBody.join('');
      request.post(requestConfig, function(err,response, body){
        emitData(response, body, requestConfig.form);
      }).pipe(res)
    });
  }
}

function proxyHttps(){
  httpServer.on('connect', function(req, socket, upgradeHead){
    var netClient = net.createConnection(INTERNAL_HTTPS_PORT);

    netClient.on('connect', function(){
      socket.write( "HTTP/1.1 200 Connection established\r\nProxy-agent: Netscape-Proxy/1.1\r\n\r\n");
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


// 解析配置文件host设置
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