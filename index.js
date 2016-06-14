/**
 * @colors: https://github.com/marak/colors.js/
 */

var http = require('http');
var r = require('request');
var R;
var fs = require('fs');
var extend = require('node.extend');
var URL = require('url');
var AppPort = '8989';
var os = require('os');
var util = require('./common/util');
var dns = require('dns');
var dnsCache = {};
// var shelljs = require('shelljs');
var config = require('./config');
var colors = require('colors');
var decache = require('decache');

R = r;
// use fiddler show request log detail
// if (true) {
//   R = R.defaults({'proxy':'http://127.0.0.1:8888'});
//   r = r.defaults({'proxy':'http://127.0.0.1:8888'});
// }

var rules;
var defaultHeaders;
var noProxy;
var hosts = {};
var server;

parseHost();
rules = config.rules;
noProxy = config.noProxy;
defaultHeaders = config.headers;

var chokidar = require('chokidar');
var watcher = chokidar.watch('./config.js', {
  ignored: /[\/\\]\./,
  persistent: true
});
watcher
.on('change', function(path) {
  util.showLog(['File', 'gray'], [path, 'bold.green'], ['Has Changed', 'gray']);
  decache('./config');
  config = require('./config');
  parseHost();
  rules = config.rules;
  noProxy = config.noProxy;
  defaultHeaders = config.headers;
})
.on('ready', function() {
  util.showLog(['Initial scan complete. Ready for changes.', 'gray']);
});


function startServer(options){
  options = options || {};
  util.showLog(['App Config:', 'underline.yellow.bold'], [JSON.stringify(options), 'yellow.bold']);
  AppPort = options['-p'] || AppPort;
  server = http.createServer(function(req, res){
    var inRules = false;
    var urlParse = URL.parse(req.url);
    if (!rules || rules.constructor!==Array) {
      util.showLog(['Proxy Rule is Empty!', 'red']);
      return;
    }

    rules.forEach(function(item, idx){
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
          _matchFiles = [];
          matchFiles.forEach(function(filename, idx){
            _matchFiles.push(item.localPath + filename);
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
      if (defaultHeaders) {
        resHeaders = extend(resHeaders, defaultHeaders);
      }
      // 返回的请求头
      if (item.responseHeaders) {
        resHeaders = extend(resHeaders, item.responseHeaders);
      }
      // local file
      if (content) {
        // Match Rule Color Theme
        util.showLog(
          [util.dateFormat(), 'green'],
          [req.method, 'green'],
          [req.url, 'yellow.underline']
        );
        res.writeHead(item.httpResponseCode || 200, resHeaders);
        res.end(content);
      }
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
      // remote file
      else{
        sendRequest(req, res, urlParse, item);
      }
    });

    if (!inRules){
      sendRequest(req, res, urlParse, null, defaultHeaders);
    }
  });
  server.listen(AppPort);
  util.showLog(['Txplayer Browser Debug Proxy: ', 'green'], ['http://127.0.0.1:'+AppPort, 'red.underline']);
}


// do request action
function sendRequest(req, res, urlParse, item, headers){
  item = item || {};
  headers = headers || {};
  var request = r, useHOST = false;
  if ( noProxy.indexOf( util.getTopDomain(urlParse.hostname) )>-1 ) {
    request = r;
  }else{
    request = R;
  }
  var requestConfig = {
    url: req.url,
    headers: req.headers,
    timeout: 10000
  };
  // set request host
  if (hosts[urlParse.hostname]) {
    requestConfig.hostname = hosts[urlParse.hostname];
    useHOST = true;
  }
  if (item.host) {
    requestConfig.hostname = item.host;
    useHOST = true;
  }
  if (!useHOST) {
    dns.lookup(urlParse.hostname, (err, addresses, family) => {
      requestConfig.hostname = addresses;
    });
  }
  if (defaultHeaders && defaultHeaders['User-Agent']){
    requestConfig.headers['User-Agent'] = defaultHeaders['User-Agent'];
  }

  if (req.method === 'GET') {
    var newRst = request.get(requestConfig, function(err,response, body){
      requestHandler({
        req: req,
        err: err,
        response: response,
        body: body,
        useHOST: useHOST,
        requestConfig: requestConfig
      });
      // newRst.pipe(res);
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
      var newRst =request.post(requestConfig, function(err,response, body){
        requestHandler({
          req: req,
          err: err,
          response: response,
          body: body,
          useHOST: useHOST,
          requestConfig: requestConfig
        });
        // newRst.pipe(res);
      }).pipe(res)
    });
  }
}

// request done
function requestHandler(options){
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
      if (options.useHOST) {
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

function parseHost(){
  hostText = util.getCodeFromNote(config.hosts);
  hosts = {};
  // parse hosts string
  hostText.split('\n').forEach(function(h, idx){
  var _hostName = null;
    h.split(/\s/).reverse().forEach(function(v, k){
      if (!v) return;
      if (v.indexOf('#')>-1) return;
      if (!_hostName){
        _hostName = v;
      }else{
        hosts[_hostName] = v;
      }
    });
  });
  util.showLog(
    ['Browser Proxy Hosts:', 'yellow.bold'],
    [JSON.stringify(hosts), 'magenta']
  );
}



module.exports = startServer;