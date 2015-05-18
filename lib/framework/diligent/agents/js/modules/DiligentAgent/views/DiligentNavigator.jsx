'use strict';

var GritterView = require('framework/cutie/GritterView/js/GritterViewController');

var StorageAgentMixin = {
    storageDidMount: function(disk) {
        GritterView.add(
            "Disk added",
            "A disk is inserted and mounted at " + disk.mountpoint,
            "/apps/b/storage/img/icon.png",
            5000
        );
    },

    storageDidUnmount: function(disk) {
        GritterView.add(
            "Disk removed",
            "Disk which was mounted at " + disk.mountpoint + " is removed",
            "/apps/b/storage/img/icon.png",
            5000
        );
    },

    storageHasError: function(error) {
        if (error === "ERROR-STOR-NO-USER-DISK")
            GritterView.add(
                "Storage Error",
                "No internal user storage found",
                "/apps/b/storage/img/icon.png",
                0
            );
        else
            GritterView.add(
                "Storage Error",
                error,
                "/apps/b/storage/img/icon.png",
                0
            );
    },

    storageInUseDidChange: function(disk) {
        GritterView.add(
            "Working disk changed",
            "Switching working disk to " + disk.name,
            "/apps/b/storage/img/icon.png",
            5000
        );
    }
};

var DiligentNavigator = React.createClass({

    mixins: [ StorageAgentMixin ],

    componentWillMount: function () {
        StorageAgent.attach(this);
    },

    componentWillUnmount: function () {
        StorageAgent.detach(this);
    },

    toggleDock: function(event) {
        $('#diligent-dock')
        .sidebar('setting', 'transition', 'push')
        .sidebar('setting', 'dimPage', false)
        .sidebar('toggle');
    },

    toggleConsole: function(event) {
        $('#diligent-console')
        .sidebar('setting', 'transition', 'overlay')
        .sidebar('setting', 'dimPage', false)
        .sidebar('setting', 'closable', false)
        .sidebar('toggle');
    },

    render: function() {
        return (
            <div className="ui fixed inverted main menu">
                <a className="item" onClick={this.toggleDock}>
                    <i className="content icon"></i>
                </a>
                <a className="item" style={{display: this.props.debug ? "inline-block" : "none"}} onClick={this.toggleConsole}>
                    <i className="bug icon"></i>
                </a>
            </div>
        );
    }
});

module.exports = DiligentNavigator;
