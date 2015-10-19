'use strict';

import assign from 'object-assign';
import StorageAPI from 'lib/api/StorageAPI';
import GritterView from 'lib/cutie/GritterView';
import Menubar from './components/Menubar';
import Sidebar from './components/Sidebar';
import UserDialog from './components/UserDialog';
import DebugView from './components/DebugView';

export default class Application {

  constructor() {

    React.initializeTouchEvents(true);

    this.configs = {
      debug: false
    };

    this.pendingCalls = [];

    $(document).ajaxError((event, jqxhr, settings, exception) => {
      if (
        jqxhr.status === 401 &&
        jqxhr.responseText === 'User authorization required'
      ) {
        if ($.cookie('userid'))
          $.removeCookie('userid', { path: '/' });

        this.pendingCalls.push(settings);

        document.body.dispatchEvent(new CustomEvent("user-dialog", {
          detail: {
            formType: 'auth',
            onApproved: () => {
              let pendingCalls = this.pendingCalls;
              this.pendingCalls = [];
              pendingCalls.forEach((call) => {
                $.ajax(call);
                this.render();
              });
            }
          }
        }));
      }
      else if (
        jqxhr.status === 403 &&
        jqxhr.responseText === 'Administrative privilege required'
      ) {
        document.body.dispatchEvent(new CustomEvent("user-dialog", {
          detail: { formType: 'admpriv' }
        }));
      }
    });

    StorageAPI.on((event) => {
      if (event.eventType === 'INSERT') {
        GritterView.add(
          "New Disk",
          "Disk '" + event.disk.name + "' is mounted at " + event.disk.mountpoint,
          "/apps/ia/storage/img/icon.png",
          5000
        );
      }
      else if (event.eventType === 'REMOVE') {
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
    document.body.addEventListener('user-dialog', (e) => {
      this.dialog.show(e.detail.formType, e.detail.onApproved, e.detail.onDenied);
    }, false);

    document.body.addEventListener('user-change', (e) => {
      React.unmountComponentAtNode(document.getElementById('app-main-view'));
      React.render(
        this.configs.appview,
        document.getElementById('app-main-view')
      );
    }, false);
  }

  render() {
    this.dialog = React.render(
      <UserDialog />,
      document.getElementById('user-dialog')
    );

    React.render(
      <Menubar debug={this.configs.debug} />,
      document.getElementById('app-menubar')
    );

    React.render(
      this.configs.appview,
      document.getElementById('app-main-view')
    );
  }
}
