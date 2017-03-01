var fs = require('fs')
var path = require('path')
var util = require('./util')
var colors = require('colors')
var configHandler = require('./config')
var config = configHandler.config
configHandler.msg.on('config-file-change', function(conf){
  config = conf
})



module.exports = (req, res)=>{
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
    if (fs.existsSync(options.responder.localFile)) {
      options.responseBody = fs.readFileSync(options.responder.localFile, 'utf-8')
    }else{
      options.responder.httpStatus = '404'
    }
  }
  // local path
  else if(options.responder.filename &&
    options.responder.filename.length===2 &&
    options.responder.localPath
  ){
    options.responder.filepath = options.responder.localPath + options.responder.filename[1];
    if (fs.existsSync(options.responder.filepath)) {
      options.responseBody = fs.readFileSync(options.responder.filepath, 'utf-8')
    }else{
      options.responder.httpStatus = '404'
    }
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
      if (fs.existsSync(filepath)) {
        options.responseBody.push( fs.readFileSync(filepath,'utf-8') )
      }else{
        options.responder.httpStatus = '404'
        options.responseBody=[]
        console.log( colors.red('[404] ' + filepath) )
      }
    })
    options.responseBody = options.responseBody.join('')
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
    options.responder.httpStatus = 200
    res.writeHead(options.responder.httpStatus, options.responseHeaders || {})
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
    if (options.responder.comboParams){
      options.remoteRequestUrl = options.responder.remoteUrl + req.url.replace(options.responder.regx, '')
    }else{
      options.remoteRequestUrl = options.responder.remoteUrl
    }
    return {
      host: options.responder.host,
      remoteUrl: options.remoteRequestUrl
    }
  }
  return false
}