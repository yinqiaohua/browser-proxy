'use strict';
var request = require('request')
var fs      = require('fs')
var pattern = require('./pattern')
var URL     = require('url')
var UI      = require('../modules/ui-app')
var util    = require('../modules/util')
var config  = require('../config.js')
var zlib    = require('zlib')
var dns     = require('dns')
var colors  = require('colors')
var Msg

UI(true).on('ui-init', function(socket){
    Msg = socket
})

var broadcast = (options)=>{
  if ( !(Msg && Msg.emit) ) return;
  Msg.emit('request', {
    url: options.url,
    sid: options.sid,
    query: options.query,
    method: options.method,
    reqHeaders: options.reqheaders,
    reqStartTime: (+new Date)
  });
}
var broadcastResponse = (options)=>{
  if ( !(Msg && Msg.emit) ) return;
  Msg.emit('response', {
    sid: options.sid,
    body: options.body || '',
    mapLocal: options.mapLocal,
    useHOST: options.useHOST ,
    reqEndTime: (+new Date),
    postBody: options.postBody,
    statusCode: options.statusCode,
    resHeaders: options.resHeaders,
    hostname: options.hostname||''
  });
}


var pac, getProxy = ()=>{
  return '';
};
var pacHandler = (data)=>{
  var injectPacFunction = fs.readFileSync('./modules/inject-pac-function.js');
  var exportsCode = [injectPacFunction, 'module.exports=FindProxyForURL'].join('\n\n');
  fs.writeFileSync('./cache/proxy.js', data + '\n\n' + exportsCode );
  pac = require('../cache/proxy.js');
  getProxy = function(hostname){
    var proxyStr = pac('', hostname);
    return 'http://' + proxyStr.replace(/^PROXY\s*/ig,'');
  };
}

if (config && config.pac) {
  if (config.pac.indexOf('http://')===0 ||config.pac.indexOf('https://')===0) {
    request.get(config.pac, function(err, resp, body){
      if (err) {
        console.error(colors.red(err));
        return;
      }
      pacHandler(body);
    })
  }else{
    fs.readFile(config.pac, 'utf-8', (err, data)=>{
      if (err) {
        console.error(colors.red(err));
        return;
      }
      pacHandler(data);
    })
  }
}

var showResponseText = (headers)=>{
  if (headers &&
    headers['content-type'] &&
    /text|html|xhtml|css|javascript|json|xml/i.test(headers['content-type'])
    && !/svg|image|mp4|video|png|gif|shockwave-flash/i.test(headers['content-type'])
  ) {
    return true;
  }
  return false;
}


module.exports = (req, res) => {
  var config = {
    headers: req.headers
  };
  config.url = req.url;
  if (!req.__sid__) req.__sid__ = util.GUID()

  var patterned
  var requestUrlData = URL.parse(req.url, true)
  var proxy = ''
  var postBody = []
  var chunks = []
  var serverIP;

  broadcast({
    url: req.httpsURL||req.url,
    sid: req.__sid__,
    query: requestUrlData.query,
    method: req.method,
    reqheaders: req.headers
  })

  // 匹配了不要再请求
  patterned = pattern(req, res) || {}
  if ( patterned.sendRequest===false ) {
    patterned.hostname = '127.0.0.1';
    broadcastResponse(patterned)
    return;
  }
  if (patterned && patterned.host) {
    config.hostname = patterned.host;
  }
  else if (patterned && patterned.remoteUrl) {
    config.url = patterned.remoteUrl;
  }

  if ( !(patterned && patterned.host) ) {
    try{
      proxy = getProxy(requestUrlData.hostname);
    }catch(e){
      proxy = ''
    }
  }
  request = request.defaults({'proxy': proxy==='http://DIRECT'?'':proxy});

  if ( !(patterned && patterned.host) ) {
    dns.lookup(requestUrlData.hostname, (err, addresses, family)=>{
      serverIP = addresses
    })
  }

  if (req.method==='GET') {
    delete config.headers['accept-encoding']
    // delte 清除缓存
    delete config.headers['cache-control'];
    delete config.headers['if-modified-since'];
    delete config.headers['if-none-match'];
    request.get(config, (err,response, body)=>{
      var resBody
      if (err || !(response && response.headers) ) return
      resBody = '';
      if ( showResponseText(response.headers) ) {
        // 解压zip
        if (response.headers['content-encoding']==='gzip') {
          var buffer = Buffer.concat(chunks)
          zlib.gunzip(buffer, (err, decoded)=>{
            if (err) {
              return
            }
            resBody = decoded.toString()
            // zip response broadcast
            broadcastResponse({
              sid: req.__sid__,
              body: resBody,
              useHOST: !!patterned.host,
              reqEndTime: (+new Date),
              statusCode: response.statusCode,
              resHeaders: response.headers,
              hostname: serverIP || patterned.host || '127.0.0.1'
            })
          });
          return;
        }else{
          resBody = body;
        }
      }else{
        resBody = ''
      }
      broadcastResponse({
        sid: req.__sid__,
        body: resBody,
        useHOST: !!patterned.host,
        reqEndTime: (+new Date),
        statusCode: response.statusCode,
        resHeaders: response.headers,
        hostname: serverIP || patterned.host || '127.0.0.1'
      })
    })
    .on('data', (chunk)=>{
      chunks.push(chunk)
    })
    .pipe(res)
  }
  else if(req.method==='POST'){
    request.post(config, (err,response, body)=>{}).pipe(res);
    // req.on('data', function (chunk) {
    //   postBody.push(chunk);
    // });
    // req.on('end', function () {
    //   config.form = postBody.join('');
    //   request.post(config, function(err,response, body){
    //     // emitData(response, body, requestConfig.form);
    //   }).pipe(res)
    // });
  }
}