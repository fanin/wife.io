'use strict';

export default class Sidebar extends React.Component {

  static defaultProps = {
    debug: false,
    homeItem: {
      text: 'Home',
      icon: 'home',
      href: '/'
    },
    infoItem: {
      text: 'About',
      icon: 'info circle',
      onClick: (e) => {}
    },
    debugItem: {
      text: 'Debug',
      icon: 'bug',
      onClick: (e) => {
        $('#app-sidebar')
          .sidebar('hide');
        $('#app-debug-view')
          .sidebar('setting', 'transition', 'overlay')
          .sidebar('setting', 'dimPage', false)
          .sidebar('setting', 'closable', false)
          .sidebar('toggle');
      }
    },
    settingsItem: {
      text: 'Settings',
      icon: 'settings',
      onClick: (e) => {}
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      items: []
    };
  }

  toggleDock(e) {
    $('#app-sidebar')
      .sidebar('setting', 'transition', 'overlay')
      .sidebar('setting', 'dimPage', false)
      .sidebar('toggle');
  }

  render() {
    var _items = this.props.debug
      ? [
          this.props.homeItem,
          this.props.infoItem,
          this.props.debugItem,
          this.props.settingsItem
        ]
      : [
          this.props.homeItem,
          this.props.infoItem,
          this.props.settingsItem
        ];

    _items.concat(this.state.items);

    var _sidebarItems = _items.map(function(item, i) {
      return (
        <a
          className="app sidebar item"
          key={'SideBarButton' + i}
          href={item.href}
          onClick={item.onClick}
        >
          <i className={item.icon + ' icon'} />
          {item.text}
        </a>
      );
    });

    return (
      <div className="ui left vertical inverted labeled icon menu">
        {_sidebarItems}
      </div>
    );
  }
}
