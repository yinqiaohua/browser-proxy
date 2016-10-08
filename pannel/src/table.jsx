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
    this.props.msg.on('requestStart', function(data){
      that.dataset.index ++
      var HostData = that.getUrlHostData(data.url)
      data = Object.assign(data, HostData)
      data.index = that.dataset.index
      that.dataset.session[data.sid] = data
      that.setState({
        rows: [that.state.rows, that.updateRows(data)]
      })
    })
    this.props.msg.on('requestDone', function(data){
      var showResponse = function(data){
        if ( !(data && data.sid) ) return;
        // Object.assign(that.dataset.session[data.sid], data)
        for(var i in data){
          that.dataset.session[data.sid][i] = data[i]
        }
        if (data.resHeaders && data.resHeaders["content-length"]) {
          that.dataset.session[data.sid]['filesize'] = that.formatFileSize(data.resHeaders["content-length"])
        }
        that.dataset.session[data.sid].timespend = that.dataset.session[data.sid].reqEndTime- that.dataset.session[data.sid].reqStartTime;

        var $sid = $('tr[data-id="' + data.sid + '"]')
        console.log(data.sid, $sid.find('td:eq(0)').text())
        $sid.find('td.data-serverip').html( data.hostname )
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
      }
      showResponse(data)
      // var elm = document.querySelector('[data-id="'+data.sid+'"]')
      // console.info(data.sid, elm,  $(elm).attr('data-id') );
    })
  }

  clickHandler(e){
    var $tr = e.target;
    if ($tr.nodeName.toLowerCase()==='td') {
      $tr = $( $tr ).parents('tr')
    }else{
      $tr = $( $tr )
    }
    var id = $tr.attr('data-id')
    this.props.msg.emit('tableClick', {
      id: id,
      data: this.dataset.session[id]
    })
  }

  updateRows(data){
    return (
      <tr data-id={data.sid} onClick={this.clickHandler}>
        <td>{data.index}</td>
        <td className='data-status'></td>
        <td className='data-protocol'>{data.protocol}</td>
        <td className='data-hostname'>{data.hostname}</td>
        <td className='data-pathname'>{data.pathname}</td>
        <td className='data-serverip'>{data.serverip}</td>
        <td className='data-timespend'>{data.timespend}</td>
        <td className='data-filesize'>{data.filesize}</td>
      </tr>
    )
  }

  render() {
    return (
      <table className="table table-small-font table-bordered table-striped request-list">
        <thead>
          <tr>
            <th>#</th>
            <th>Result</th>
            <th>Protocol</th>
            <th>Host</th>
            <th>URL</th>
            <th>ServerIp</th>
            <th>TimeSpend</th>
            <th>FileSize</th>
          </tr>
        </thead>
        <tbody>{this.state.rows||[]}</tbody>
      </table>
    )
  }
}

export default Table