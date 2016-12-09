var colors = require('colors')
var path = require('path')
var caConfig = require('./ca-config.js')
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
var config = require(configFile)
console.log( colors.yellow('browser-proxy Config Filepath: ') + colors.green.underline(configFile) )
var chokidar = require('chokidar')
var watcher = chokidar.watch(configFile, {
  ignored: /[\/\\]\./,
  persistent: true
});
var Events = require('events')
var msg = new Events()
msg.setMaxListeners(1000)

watcher.on('change', function(path) {
  console.log([
    colors.gray('['+new Date().toLocaleTimeString().replace(/上午|下午/,'')+']'),
    colors.yellow('pattern config changed:'),
    colors.green.underline(configFile)
  ].join(''))
  delete require.cache[require.resolve(configFile)]
  config = require(configFile)
  msg.emit('config-file-change', config)
})
.on('ready', function() {
  console.log( colors.yellow('watcher ready:') + colors.green.underline(configFile) );
})


module.exports = {
	config: config,
	msg: msg,
  homePath: caConfig.getDefaultCABasePath()
}