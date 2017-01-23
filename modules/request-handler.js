'use strict';
var request = require('request')
var path = require('path')
var fs      = require('fs')
var pattern = require('./pattern')
var URL     = require('url')
var UI      = require('../modules/ui')
var util    = require('../modules/util')
var zlib    = require('zlib')
var dns     = require('dns')
var colors  = require('colors')
var qs = require('qs')
var Msg
var configHandler = require('./config')
var config = configHandler.config
configHandler.msg.on('config-file-change', function(conf){
  config = conf
})




UI(true).on('ui-init', function(socket){
  Msg = socket
  Msg.on('loadConfig',()=>{
    Msg.emit('responseConfig', config)
  })
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
    hostname: options.hostname||'',
    serverip: options.serverip||''
  });
}


var pac, getProxy = ()=>{
  return '';
};
var pacHandler = (data)=>{
  var injectPacFunction = fs.readFileSync( path.resolve(__dirname,'./pac.js') );
  var exportsCode = [injectPacFunction, 'module.exports=FindProxyForURL'].join('\n\n');
  var proxyCache = configHandler.homePath + '/proxy.js';
  fs.writeFileSync(proxyCache, data + '\n\n' + exportsCode );
  pac = require(proxyCache);
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
  var requestConfig = {
    headers: req.headers
  };
  requestConfig.url = req.url;
  if (!req.__sid__) req.__sid__ = util.GUID()

  var patterned
  var requestUrlData = URL.parse(req.url, true)
  var proxy = ''
  var postBody = []
  var chunks = []
  var serverIP;

  if (config.disable_cache) {
    // delte 清除缓存
    delete requestConfig.headers['cache-control'];
    delete requestConfig.headers['if-modified-since'];
    delete requestConfig.headers['if-none-match'];
  }
  if (config.disable_gzip) {
    // 禁止gzip
    delete requestConfig.headers['accept-encoding']
  }

  if (req.method==='GET') {
    broadcast({
      url: req.httpsURL||req.url,
      sid: req.__sid__,
      query: requestUrlData.query,
      method: req.method,
      reqheaders: requestConfig.headers
    })
  }

  // 匹配了不要再请求
  patterned = pattern(req, res) || {}
  if ( patterned.sendRequest===false ) {
    patterned.serverip = '127.0.0.1';
    broadcastResponse(patterned)
    return;
  }
  if (patterned && patterned.host) {
    requestConfig.hostname = patterned.host;
  }
  else if (patterned && patterned.remoteUrl) {
    requestConfig.url = patterned.remoteUrl;
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
    request.get(requestConfig, (err,response, body)=>{
      showResponseData(err,response, body, patterned, req, serverIP, chunks)
    })
    .on('data', (chunk)=>{
      chunks.push(chunk)
    })
    .pipe(res)
  }
  else if(req.method==='POST'){
    req.on('data', (chunk)=>{
      postBody.push(chunk);
    });
    req.on('end', () =>{
      requestConfig.form = postBody.join('')
      broadcast({
        url: req.httpsURL||req.url,
        sid: req.__sid__,
        query: qs.parse(requestConfig.form),
        method: req.method,
        reqheaders: req.headers
      })
      request.post(requestConfig,(err,response, body)=>{
        showResponseData(err,response, body, patterned, req, serverIP, chunks)
      })
      .on('data', (chunk)=>{
        chunks.push(chunk)
      })
      .pipe(res)
    });
  }
}

var showResponseData=(err,response, body, patterned, req, serverIP, chunks)=>{
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
          statusCode: response.statusCode,
          resHeaders: response.headers,
          serverip: serverIP || patterned.host || '127.0.0.1'
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
    statusCode: response.statusCode,
    resHeaders: response.headers,
    serverip: serverIP || patterned.host || '127.0.0.1'
  })
}