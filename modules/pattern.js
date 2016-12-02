var path = require('path')
var configFile = path.resolve('./config.js');
var config = require(configFile)
var fs = require('fs')
var util = require('./util')
var chokidar = require('chokidar')
var colors = require('colors')


var watcher = chokidar.watch(configFile, {
  ignored: /[\/\\]\./,
  persistent: true
});
watcher.on('change', function(path) {
  console.log([
    colors.gray('['+new Date().toLocaleTimeString().replace(/上午|下午/,'')+']'),
    colors.yellow('pattern config changed:'),
    colors.green.underline(configFile)
  ].join(''))
  delete require.cache[require.resolve(configFile)]
  config = require(configFile);
})
.on('ready', function() {
  console.log( colors.yellow('watcher ready:') + colors.green.underline(configFile) );
});

module.exports = rulePattern = (req, res)=>{
  var options = {};
  // match request url
  config.rules.forEach((rule, idx)=>{
    if (options.matched) return;
    if (typeof rule.regx==='string') {
      rule.regx = rule.regx.replace(/\//g,'\/').replace(/\./g,'\.')
      rule.regx = new RegExp(rule.regx, 'i')
    }
    if ( rule.regx.test(req.url) ) {
      options.matched = true
      options.responder = rule
      options.responder.filename = req.url.match(rule.regx)
    }
    if (rule.comboMaps && rule.indexof && options.matched) {
      options.matched = req.url.indexOf(rule.indexof) > -1
    }
  })
  if (!options.matched) return false

  // localFile
  if (options.responder.localFile) {
    options.responseBody = fs.readFileSync(options.responder.localFile, 'utf-8')
  }
  // local path
  else if(options.responder.filename &&
    options.responder.filename.length===2 &&
    options.responder.localPath
  ){
    options.responder.filepath = options.responder.localPath + options.responder.filename[1];
    options.responseBody = fs.readFileSync(options.responder.filepath, 'utf-8')
  }
  // combo
  else if( options.responder.filename &&
    options.responder.filename.length===2 &&
    options.responder.comboMaps
  ){
    options.responder.filename = options.responder.filename[1]
    options.responder.comboList = options.responder.filename.split(',')
    options.responder.matchFiles = []
    options.responder.comboList.forEach((sCombo, idx)=>{
      // 含有/的部分
      if (sCombo && sCombo.indexOf('/')>-1) {
        options.basepathMatch = sCombo.match(/(\/[^\/]+)+\//)
        if (options.basepathMatch && options.basepathMatch.length===2) {
          options.basePath = options.basepathMatch[0]
        }
        options.singleFilePath = sCombo
      }else{
        options.singleFilePath = options.basePath + sCombo
      }
      if ( options.responder.comboMaps && options.responder.comboMaps[options.basePath]) {
        options.singleFilePath = options.singleFilePath.replace(options.basePath, options.responder.comboMaps[options.basePath]);
      }
      options.responder.matchFiles.push(options.singleFilePath)
    })
    options.responseBody = []
    options.responder.matchFiles.forEach((filepath, idx)=>{
      options.responseBody.push( fs.readFileSync(filepath,'utf-8') )
    })
    options.responseBody = options.responseBody.join('')
    // options.responseHeaders = options.responder.responseHeaders
  }
  // Interceptor
  else if(typeof options.responder.requestInterceptor==='function'){
    options.responder.requestInterceptor(req, res)
    return true
  }
  // jsonp
  else if (options.responder.jsonp){
    options.jsonpcallback = util.getUrlParam('callback', req.url)
    options.responseBody = fs.readFileSync(options.responder.jsonp, 'utf-8')
    options.responseBody = options.jsonpcallback + '(' + options.responseBody + ')'
  }
  // http status
  else if(options.responder.httpStatus){
    res.writeHead(options.responder.httpStatus, options.responseHeaders || {})
    res.end()
    return {
      sid: req.__sid__,
      mapLocal: true,
      statusCode: options.responder.httpStatus,
      resHeaders: options.responder,
      sendRequest: false
    }
  }

  if (options.responder && options.responder.responseHeaders) {
    options.responseHeaders = options.responder.responseHeaders
  }

  // do response
  if (options.responseBody) {
    res.writeHead(200, options.responseHeaders || {});
    res.end( options.responseBody )
    return {
      sid: req.__sid__,
      mapLocal: true,
      body: options.responseBody,
      statusCode: options.responder.httpStatus,
      resHeaders: options.responder,
      sendRequest: false
    }
  }else{
    return {
      host: options.responder.host,
      remoteUrl: options.responder.remoteUrl
    }
  }
  return false
}