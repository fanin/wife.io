'use strict';

var GritterView = require('framework/cutie/GritterView/js/GritterViewController');
var StorageAPI = require('diligent/Storage/StorageAPI');

var Menubar = React.createClass({

    componentWillMount: function () {
        StorageAPI.onDiskEvent(function(event) {
            if (event.eventType === "INSERT") {
                GritterView.add(
                    "Disk added",
                    "A disk is inserted and mounted at " + event.disk.mountpoint,
                    "/apps/ia/storage/img/icon.png",
                    5000
                );
            }
            else if (event.eventType === "REMOVE") {
                GritterView.add(
                    "Disk removed",
                    "Disk which was mounted at " + event.disk.mountpoint + " is removed",
                    "/apps/ia/storage/img/icon.png",
                    5000
                );
            }
        });
    },

    componentWillUnmount: function () {

    },

    toggleDock: function(event) {
        $('#diligent-sidebar')
            .sidebar('setting', 'transition', 'push')
            .sidebar('setting', 'dimPage', false)
            .sidebar('toggle');
    },

    render: function() {
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
