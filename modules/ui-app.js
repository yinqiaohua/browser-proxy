var Events = require('events')
var msg = new Events()
var config = require('../modules/ca-config.js')
msg.setMaxListeners(1000)

module.exports = (create) => {
	if (!create) return msg;
	var app = require('http').createServer(handler)
	var io = require('socket.io')(app);
	var fs = require('fs');

	app.listen(9000);

	function handler(req, res) {
		var filepath;
		if (req.url === '/') {
			req.url = '/index.html';
		}
		if (req.url === '/install') {
			req.url = '/install.html';
		}
		if (req.url.indexOf('/') === 0) {
			filepath = req.url;
		} else {
			return;
		}
		if (req.url === '/cert.crt') {
			res.writeHead(200, {
				'Content-Type': 'application/octet-stream'
			});
			res.end(fs.readFileSync(config.getDefaultCACertPath()));
			return;

		}

		fs.readFile(__dirname + '/../ui' + filepath,
			function(err, data) {
				if (err) {
					res.writeHead(500);
					return res.end('Error loading index.html');
				}
				res.writeHead(200);
				res.end(data);
			});
	}
	io.on('connection', function(socket) {
		msg.emit('ui-init', socket)
	});
	return msg;
}