'use strict'

var assign      = require("object-assign");
var StorageAPI  = require('lib/api/StorageAPI');
var Menubar     = require('lib/cutie/Menubar');
var Sidebar     = require('lib/cutie/Sidebar');
var DebugView   = require('lib/cutie/DebugView');
var GritterView = require('lib/cutie/GritterView');

class Application {

    constructor() {

        this.configs = {
            debug: false
        };

        StorageAPI.onDiskEvent(function(event) {
            if (event.eventType === "INSERT") {
                GritterView.add(
                    "New Disk",
                    "Disk '" + event.disk.name + "' is mounted at " + event.disk.mountpoint,
                    "/apps/ia/storage/img/icon.png",
                    5000
                );
            }
            else if (event.eventType === "REMOVE") {
                GritterView.add(
                    "Disk Removed",
                    "Disk '" + event.disk.name + "' is unmounted",
                    "/apps/ia/storage/img/icon.png",
                    5000
                );
            }
        });
    }

    configure(conf) {
        assign(this.configs, conf);
    }

    render(AppMainView) {

        React.render(
            <Menubar />,
            document.getElementById('diligent-menubar')
        );

        React.render(
            <Sidebar debug={this.configs.debug} />,
            document.getElementById('diligent-sidebar')
        );

        React.render(
            <DebugView />,
            document.getElementById('diligent-debug-view')
        );

        React.render(
            <AppMainView />,
            document.getElementById('app-view')
        );
    }
}

module.exports = Application;
