'use strict';

import assign from 'object-assign';
import StorageAPI from 'lib/api/StorageAPI';
import DebugView from 'lib/cutie/DebugView';
import GritterView from 'lib/cutie/GritterView';
import Menubar from './Components/Menubar';
import Sidebar from './Components/Sidebar';
import UserDialog from './Components/UserMenu/UserDialog.jsx';

export default class Application {

  constructor() {

    React.initializeTouchEvents(true);

    this.configs = {
      debug: false
    };

    $(document).ajaxError((event, jqxhr, settings, exception) => {
      if (jqxhr.status === 401) {
        if (settings.url.indexOf('/user') === 0) {
          if ($.cookie('userid'))
            $.removeCookie('userid', { path: '/' });
        }
        else {
          React.unmountComponentAtNode(document.getElementById('user-dialog'));
          React.render(
            <UserDialog
              onSuccess={() => {
                $.ajax(settings);
                this.render();
              }}
            />,
            document.getElementById('user-dialog')
          );
        }
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
