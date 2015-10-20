'use strict';

import UserMenu from '../UserMenu';

export default class Menubar extends React.Component {
  render() {
    return (
      <div className="ui fixed inverted main menu">
        <a className="item" href="/">
          <i className="block layout icon"></i>
        </a>
        <div className="right menu">
          <UserMenu />
        </div>
      </div>
    );
  }
}
