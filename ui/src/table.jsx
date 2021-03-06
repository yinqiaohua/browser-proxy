import React from 'react'

class Table extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      rows: []
    }
    this.dataset = {
      session: {},
      index: 0
    }
    window.zobor = this.dataset
    this.init()

    this.clickHandler = this.clickHandler.bind(this)
  }

  getUrlHostData(url){
    var a=document.createElement('a')
    a.href = url
    return {
      protocol: a.protocol.replace(':',''),
      hostname: a.hostname,
      pathname: a.pathname
    }
  }

  formatFileSize(fs){
    var size = parseFloat(fs)
    if (size > 1024) {
      size = parseInt(size / 102.4)/10 + 'k'
    }else{
      size += 'b'
    }
    return size
  }

  init(){
    var that = this;
    this.props.msg.on('requestStart', data=>{
      that.dataset.index ++
      var HostData = that.getUrlHostData(data.url)
      data = Object.assign(data, HostData)
      data.index = that.dataset.index
      that.dataset.session[data.sid] = data
      if (
        that.dataset.keyword &&
        that.dataset.session[data.sid] &&
        that.dataset.session[data.sid].url &&
        that.dataset.session[data.sid].url.toLowerCase().indexOf(that.dataset.keyword.toLowerCase())===-1){
        return;
      }
      var rows = that.state.rows
      rows.push(that.updateRows(data))
      that.setState({
        rows: rows
      })
    })
    this.props.msg.on('requestDone', data=>{
      if ( !(data && data.sid) ) return;
      if (data && !data.hostname) delete data.hostname
      if ( that.dataset.session[data.sid] && data) {
        Object.assign(that.dataset.session[data.sid], data)
      }
      if (!that.dataset.session[data.sid]){
        that.dataset.session[data.sid] = {}
      }
      if (data.resHeaders && data.resHeaders["content-length"]) {
        that.dataset.session[data.sid]['filesize'] = that.formatFileSize(data.resHeaders["content-length"])
      }
      that.dataset.session[data.sid].timespend = that.dataset.session[data.sid].reqEndTime- that.dataset.session[data.sid].reqStartTime;

      if (
        that.dataset.keyword &&
        that.dataset.session[data.sid] &&
        that.dataset.session[data.sid].url &&
        that.dataset.session[data.sid].url.toLowerCase().indexOf(that.dataset.keyword.toLowerCase())===-1){
        return;
      }
      var $sid = $('tr[data-id="' + data.sid + '"]')
      $sid.find('td.data-serverip').html( data.serverip )
      $sid.find('td.data-status').html( data.statusCode )
      $sid.find('td.data-timespend').html( that.dataset.session[data.sid].timespend )
      if (data.useHOST) {
        $sid.addClass('tr-host-selected')
      }
      if (data.mapLocal) {
        $sid.addClass('tr-maplocal-selected')
      }
      if ( (data.statusCode+'').indexOf('4')===0 ) {
        $sid.addClass('tr-status-400')
      }
      $sid.find('td.data-filesize').html( that.dataset.session[data.sid].filesize )
    })
    this.props.msg.on('filter', data=>{
      that.dataset.keyword = data.value;
      var list = [];
      if (that.dataset.keyword) {
        $.each(that.dataset.session, (idx, item)=>{
          if (item && item.url && item.url.toLowerCase().indexOf(that.dataset.keyword.toLowerCase())>-1) {
            list.push( that.updateRows(item) )
          }
        })
      }else{
        $.each(that.dataset.session, (idx, item)=>{
          list.push( that.updateRows(item) )
        })
      }
      that.setState({rows: list})
    })
    this.keybordSekect()
  }

  keybordSekect(){
    var that = this
    $(document).on('keydown', e=>{
      if (!e.shiftKey) {
        if (e.keyCode===38) {
          that.selectUp()
          e.preventDefault()
        }
        if (e.keyCode===40) {
          that.selectDown()
          e.preventDefault()
        }
      }
    })
  }

  selectUp(){
    var $select = $('.click-selected')
    var $prev = $select.prev();
    if ($prev) {
      $prev.addClass('click-selected').siblings().removeClass('click-selected')
      setTimeout(()=>{
        $prev.click()
      })
    }
  }

  selectDown(){
    var $select = $('.click-selected')
    var $next = $select.next();
    if ($next) {
      $next.addClass('click-selected').siblings().removeClass('click-selected')
      setTimeout(()=>{
        $next.click()
      })
    }
  }

  clickHandler(e){
    var $tr = e.target
    if ($tr.nodeName.toLowerCase()==='td') {
      $tr = $( $tr ).parents('tr')
    }else{
      $tr = $( $tr )
    }
    var id = $tr.attr('data-id')
    $tr.addClass('click-selected').siblings().removeClass('click-selected')
    this.props.msg.emit('tableClick', {
      id: id,
      data: this.dataset.session[id]
    })
  }

  updateRows(data){
    return (
      <tr data-id={data.sid} onClick={this.clickHandler}>
        <td>{data.index}</td>
        <td className='data-status'>{data.statusCode}</td>
        <td className='data-protocol'>{data.protocol}</td>
        <td className='data-hostname'>{data.hostname}</td>
        <td className='data-serverip'>{data.serverip}</td>
        <td className='data-timespend'>{data.timespend}</td>
        <td className='data-filesize'>{data.filesize}</td>
        <td className='data-pathname'>{data.pathname}</td>
      </tr>
    )
  }

  render() {
    return (
      <div className="scroll-table noselect">
        <table className="table table-small-font table-bordered table-striped request-list">
          <thead>
            <tr>
              <th>#</th>
              <th>结果</th>
              <th>协议</th>
              <th>域名</th>
              <th>服务器IP</th>
              <th>耗时</th>
              <th>大小</th>
              <th>路径</th>
            </tr>
          </thead>
          <tbody>{this.state.rows||[]}</tbody>
        </table>
      </div>
    )
  }
}

export default Table