'use strict';

var Sidebar = React.createClass({
    getDefaultProps: function () {
        return {
            debug: false,
            homeItem: {
                text: 'Home',
                icon: 'home',
                href: '/'
            },
            infoItem: {
                text: 'About',
                icon: 'info circle',
                onClick: function(e) {

                }
            },
            debugItem: {
                text: 'Debug',
                icon: 'bug',
                onClick: function(e) {
                    $('#diligent-sidebar')
                        .sidebar('hide');
                    $('#diligent-debug-view')
                        .sidebar('setting', 'transition', 'overlay')
                        .sidebar('setting', 'dimPage', false)
                        .sidebar('setting', 'closable', false)
                        .sidebar('toggle');
                }
            },
            settingsItem: {
                text: 'Settings',
                icon: 'settings',
                onClick: function(e) {

                }
            }
        };
    },
    getInitialState: function () {
        return {
            items: []
        };
    },

    render: function() {
        var _items = this.props.debug
            ? [ this.props.homeItem, this.props.infoItem, this.props.debugItem, this.props.settingsItem ]
            : [ this.props.homeItem, this.props.infoItem, this.props.settingsItem ];
        _items.concat(this.state.items);

        var _sidebarItems = _items.map(function(item, i) {
            return (
                <a className="diligent sidebar item" key={'SideBarButton' + i} href={item.href} onClick={item.onClick}>
                    <i className={item.icon + ' icon'}></i>
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
});

module.exports = Sidebar;
