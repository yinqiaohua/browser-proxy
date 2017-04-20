var colors = require('colors')
var path = require('path')
var caConfig = require('./cert.js')
var configFile = path.resolve('./config.js')
var defaultConfigFile = caConfig.getDefaultCABasePath()+'/config.js';
var fs = require('fs')

if (!fs.existsSync(configFile)) {
  if ( !fs.existsSync(defaultConfigFile) ) {
    fs.writeFileSync( defaultConfigFile,
      fs.readFileSync(path.resolve(__dirname, '../config.example.js'), 'utf-8')
    )
  }
  configFile = defaultConfigFile
}
var config = parseConfig(configFile)
console.log(
  colors.yellow(`[配置文件] ${configFile}`)
)
var chokidar = require('chokidar')
var watcher = chokidar.watch(configFile, {
  ignored: /[\/\\]\./,
  persistent: true
});
var Events = require('events')
var msg = new Events()
msg.setMaxListeners(1000)

watcher.on('change', function(path) {
  console.log(
    colors.yellow(`[配置变更] `) +
    colors.gray(`[${new Date().toLocaleTimeString()}] `)+
    colors.yellow(`${configFile}`)
  )
  delete require.cache[require.resolve(configFile)]
  config = parseConfig(configFile)
  msg.emit('config-file-change', config)
})
.on('ready', function() {
  console.log( 
    colors.yellow(`[配置监听] ${configFile}`) 
  );
})

function parseConfig(configFile){
  var conf = require(configFile)
  var host = conf.host
  var list = []
  var rules = []
  var filter = []
  var hash = {}
  if (!host) return conf
  host = host.replace(/#.+\n/g,'')
  list = host.split(/\n/)
  list.map((item)=>{
    if (!item) return
    var arr = item.split(/\s+/)
    if (arr.length!=2) return
    rules.push({
      regx: `^https?://${arr[1]}`,
      host: arr[0]
    })
  })
  conf.rules = conf.rules.concat(conf.rules, rules)
  conf.rules.map((item)=>{
    if (!item.regx) return
    var key = item.regx.toString()
    if (hash[key]) {
      return
    }
    filter.push(item)
    hash[key] = 1
  })
  conf.rules = filter
  return conf;
}


module.exports = {
  config: config,
  msg: msg,
  homePath: caConfig.getDefaultCABasePath()
}