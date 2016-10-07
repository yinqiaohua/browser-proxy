import React from 'react'

class ResDetail extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      layer: []
    }
  }

  show(){
    this.setState({
      layer: this.buildResponseHtml()
    })
  }

  buildResponseHtml(data){
    return (
      <div className="panel panel-default detail-layer-pannel" id="layer-pannel" style="display: none2;">
        <div className="panel-heading">
          <h3 className="panel-title">Request Detail Pannel</h3>
          <div className="panel-options">
            <a href="javascript:;" id="close-layer-dialog">×</a>
          </div>
        </div>
        <div className="panel-body">
          <h3 id="response-url-title" className="response-url-title"></h3>
          <div className="dataTables_wrapper form-inline dt-bootstrap">
            <div className="row" style="display: none;">
              <div className="col-sm-5"></div>
              <div className="col-sm-7">
                <div className="DTTT_container">
                  <a className="DTTT_button"><span>Request Headers</span></a>
                  <a className="DTTT_button"><span>Request Params</span></a>
                  <a className="DTTT_button"><span>Request Cookies</span></a>

                  <a className="DTTT_button"><span>Response Headers</span></a>
                  <a className="DTTT_button"><span>Response Content</span></a>
                </div>
              </div>
            </div>

            <div id="response-pannel">

            </div>
          </div>
        </div>
      </div>
    )
  }

  render(){
    return (
      <div>{this.state.layer}</div>,
      document.getElementById('res-container')
    )
  }
}

export default ResDetail