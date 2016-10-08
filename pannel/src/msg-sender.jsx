import React from 'react';

class msgSender extends React.Component {
  constructor(props){
    super(props)
    this.init()
  }
  init(){
    var that = this;
    jQuery.getScript('http://127.0.0.1:9000/socket.io/socket.io.js').done(function(){
      var socket = io('http://localhost:9000');
      socket.on('request', function (data) {
        window.lastData = data;
        that.props.msg.emit('requestStart', data);
      });

      socket.on('response', function (data) {
        // var elm = document.querySelector('[data-id="'+data.sid+'"]')
        // console.log(data.sid, elm,  $(elm).attr('data-id') )
        that.props.msg.emit('requestDone', data);
      });
    });
  }

  render(){
    return null
  }
}
export default msgSender;