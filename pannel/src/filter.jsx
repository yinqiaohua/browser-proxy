import React from 'react'

class Filter extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      keyword: ''
    }

    this.init()

    this.handlerKeyDown = this.handlerKeyDown.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  init(){
    var keyword = this.getHistoryMsg()
    var that = this
    if (keyword){
      setTimeout(()=>{
        that.sendMsg(keyword)
        that.setState({keyword: keyword})
      },500)
    }
  }

  handlerKeyDown(e) {
    if (e.keyCode === 13) {
      this.sendMsg(e.target.value)
      this.saveMsg(e.target.value)
    }
  }

  handleChange(e){
    this.setState({keyword: e.target.value});
  }

  sendMsg(msg){
    this.props.msg.emit('filter', {
      value: msg
    })
  }

  saveMsg(msg){
    try{
      window.localStorage.setItem('browser-proxy-filter-keyword', msg);
    }catch(e){}
  }

  getHistoryMsg(){
    return window.localStorage.getItem('browser-proxy-filter-keyword');
  }

  render(){
    return (
      <div className="input-group" >
        <div className="input-group-addon" >filter http request</div>
        <input onKeyDown={this.handlerKeyDown} onChange={this.handleChange} className="form-control" type="text" placeholder="filter here" value={this.state.keyword} />
      </div>
    )
  }
}

export default Filter