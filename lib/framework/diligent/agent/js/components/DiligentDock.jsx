'use strict';

var DiligentDock = React.createClass({
    render: function() {
        return (
            <div className="ui inverted labeled icon menu">
                <a className="item" href="%PROTO%://%SYSIP%:%SYSPORT%">
                    <i className="home icon"></i>
                    Home
                </a>
                <a className="item">
                    <i className="settings icon"></i>
                    Settings
                </a>
            </div>
        );
    }
});

module.exports = DiligentDock;
