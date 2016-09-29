var Table = React.createClass({
  getInitialState: function () {
    return { count: 0 };
  },
  handleClick: function () {
  },
  render: function () {
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
        <tbody id="data-list"></tbody>
      </table>
    );
  }
});
module.exports = Table;