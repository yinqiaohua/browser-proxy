var Header = React.createClass({
  getInitialState: function () {
    return { count: 0 };
  },
  handleClick: function () {
    this.setState({
      count: this.state.count + 1,
    });
  },
  render: function () {
    return (
      <div className="form-inline filter-control">
        <div className="form-group">
          <div className="input-group">
            <div className="input-group-addon">filter http request</div>
            <input className="form-control" type="text" placeholder="filter here" id="filter-handler" />
          </div>
        </div>
      </div>
    );
  }
});
module.exports = Header;