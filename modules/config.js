var path = require('path')
var configFile = path.resolve('./config.js')
var colors = require('colors')
var config = require(configFile)
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
	msg: msg
}