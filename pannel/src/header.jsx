import React from 'react';

class Header extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
  }

  handlerKeyDown(e) {
    if (e.keyCode === 13) {
      console.log(e.target.value)
    }
  }

  render() {
    return (
      <div className="form-inline filter-control">
        <div className="form-group" >
          <div className="input-group" >
            <div className="input-group-addon" >filter http request</div>
              <input onKeyDown={this.handlerKeyDown} className="form-control" type="text" placeholder="filter here" />
          </div>
        </div>
      </div>
    );
  }
}

export default Header;