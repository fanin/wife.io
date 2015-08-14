'use strict';

var Menubar = React.createClass({

    toggleDock(event) {
        $('#app-sidebar')
            .sidebar('setting', 'transition', 'push')
            .sidebar('setting', 'dimPage', false)
            .sidebar('toggle');
    },

    render() {
        return (
            <div className="ui fixed inverted main menu">
                <a className="item" onClick={this.toggleDock}>
                    <i className="content icon"></i>
                </a>
            </div>
        );
    }
});

module.exports = Menubar;
