var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var deferred = require('deferred');
var def = deferred();
var Msg;

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

  fs.readFile(__dirname + '/../pannel' + filepath,
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
  def.resolve(socket);
  socket.on('test', function(data){
    console.log(data)
  })
});

module.exports = {
  getIOMsg: function(){
    if (Msg) {
      def.resolve(Msg);
    }
    return def.promise;
  }
};