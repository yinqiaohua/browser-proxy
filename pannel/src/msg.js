$.getScript('http://127.0.0.1:9000/socket.io/socket.io.js').done(function(){
  var socket = io('http://localhost:9000');
  socket.on('request', function (data) {
    window.lastData = data;
    // updateRequestData(data);
  });

  socket.on('response', function (data) {
    // updateResponseData(data);
  });
});