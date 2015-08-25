'use strict';

export default class DebugView extends React.Component {
  render() {
    return (
      <table className="ui small compact table">
        <thead>
          <tr>
            <th>Information</th>
            <th className="twelve wide">Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    );
  }
}
