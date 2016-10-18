import React from 'react';

class msgSender extends React.Component {
  constructor(props){
    super(props)
    this.init()
  }
  init(){
    var that = this;
    jQuery.getScript('http://127.0.0.1:9000/socket.io/socket.io.js').done(()=>{
      var socket = io('http://localhost:9000');
      socket.on('request', data=>{
        console.log(data)
        that.props.msg.emit('requestStart', data);
      });

      socket.on('response', data=>{
        that.props.msg.emit('requestDone', data);
      });
      socket.on('init', data=>{
        console.log('server inited:' + data.t)
      });
      window.debugSocket = socket;
    });
  }

  render(){
    return null
  }
}
export default msgSender;