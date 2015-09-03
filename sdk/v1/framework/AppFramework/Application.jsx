'use strict';

import assign from 'object-assign';
import StorageAPI from 'lib/api/StorageAPI';
import Menubar from 'lib/cutie/Menubar';
import Sidebar from 'lib/cutie/Sidebar';
import DebugView from 'lib/cutie/DebugView';
import GritterView from 'lib/cutie/GritterView';
import LoginView from './LoginView';

export default class Application {

  constructor() {

    this.configs = {
      debug: false
    };

    $(document).ajaxError((event, jqxhr, settings, exception) => {
      if (jqxhr.status === 401) {
        React.render(
          <LoginView
            title="Authorization Required"
            onSuccess={() => {
              $.ajax(settings);
              React.render(
                this.configs.appview,
                document.getElementById('app-main-view')
              );
            }}
          />,
          document.getElementById('app-login')
        );
      }
    });

    StorageAPI.onDiskEvent((event) => {
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

  render() {
    React.render(
      <Menubar />,
      document.getElementById('app-menubar')
    );

    React.render(
      <Sidebar debug={this.configs.debug} />,
      document.getElementById('app-sidebar')
    );

    React.render(
      <DebugView />,
      document.getElementById('app-debug-view')
    );

    React.render(
      this.configs.appview,
      document.getElementById('app-main-view')
    );
  }
}
