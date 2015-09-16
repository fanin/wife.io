'use strict';

import UserMenu from '../UserMenu';

export default class Menubar extends React.Component {

  toggleDock(e) {
    $('#app-sidebar')
      .sidebar('setting', 'transition', 'overlay')
      .sidebar('setting', 'dimPage', false)
      .sidebar('toggle');
  }

  render() {
    return (
      <div className="ui fixed inverted main menu">
        <a className="item" onClick={this.toggleDock}>
          <i className="content icon"></i>
        </a>
        <div className="right menu">
          <UserMenu />
        </div>
      </div>
    );
  }
}
