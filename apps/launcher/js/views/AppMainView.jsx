import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import LauncherAppIcon from './LauncherAppIcon.jsx';
import LauncherSortable from './LauncherSortable.jsx';
import LauncherConstants from '../constants/LauncherConstants';
import LauncherActionCreators from '../actions/LauncherActionCreators';
import LauncherStore from '../stores/LauncherStore';
import AppAPI from 'lib/api/AppAPI';

export default class AppMainView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      appList: [],
      manageable: false,
      alertTitle: '',
      alertMessage: ''
    };
  }

  componentWillMount() {
    LauncherStore.addChangeListener(this.onLauncherChanges.bind(this));
    LauncherStore.addErrorListener(this.onLauncherError);

    AppAPI.list({
      onSuccess: function(list) {
        LauncherActionCreators.sortAppList(list);
      },
      onError: function(error) {
        console.log('Unable to get app list, error: ' + error.message);
      }
    });
  }

  componentWillUnmount() {
    LauncherStore.removeErrorListener(this.onLauncherError);
    LauncherStore.removeChangeListener(this.onLauncherChanges);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Saving app list if any app icon moved
    if (this.state.manageable) {
      let oldList = LauncherStore.getAppSortList();
      let diff = (this.state.appList.length != oldList.length) ||
                 !this.state.appList.every((el, i) => {
                   return el === oldList[i];
                 });
      if (diff)
        LauncherActionCreators.writeSortedAppList(this.state.appList);
    }
    return true;
  }

  enterManageMode() {
    LauncherActionCreators.manageApps(true);
  }

  leaveManageMode() {
    LauncherActionCreators.manageApps(false);
  }

  handleSort(newOrder) {
    var newList = newOrder.map((index) => {
      return this.state.appList[index];
    });
    this.setState({ appList: newList });
  }

  handleUninstall(appid) {
    AppAPI.getAppByID(appid, {
      onSuccess: (manifest) => {
        this._manifest = manifest;
        this.setState({
          alertTitle: 'Uninstall APP',
          alertMessage: 'Are you sure to uninstall ' + this._manifest.name + ' ?'
        });
        this.refs.alertDialog.show();
      },
      onError: (error) => {
        console.log('Unable to get app, error: ' + error.message);
      }
    });
  }

  handleUninstallAffirmative() {
    AppAPI.uninstall(this._manifest, 0, {
      onSuccess: () => {
        LauncherActionCreators.removeAppFromSortList(this._manifest);
      },
      onError: (error) => {
        console.log('Unable to uninstall app, error: ' + error.message);
        if (error.message === 'App Path Not Found')
          LauncherActionCreators.removeAppFromSortList(this._manifest);
      }
    });
  }

  handleUninstallNegative() {

  }

  onLauncherChanges(changes) {
    switch (changes.type) {
      case LauncherConstants.LAUNCHER_SORT_APP_LIST:
        this.setState({ appList: LauncherStore.getAppSortList() });
        break;
      case LauncherConstants.LAUNCHER_WRITE_SORT_APP_LIST:
        break;
      case LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST:
        this.setState({ appList: LauncherStore.getAppSortList() });
        break;
      case LauncherConstants.LAUNCHER_ENTER_MANAGE_MODE:
        this.setState({ manageable: true });
        break;
      case LauncherConstants.LAUNCHER_LEAVE_MANAGE_MODE:
        this.setState({ manageable: false });
        break;
      case LauncherConstants.LAUNCHER_MOVE_APP_ICON:
        break;
    }
  }

  onLauncherError(error) {
    switch (error.type) {
      case LauncherConstants.LAUNCHER_WRITE_SORT_APP_LIST:
        break;
      case LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST:
        break;
    }
  }

  render() {
    let appIcons = this.state.appList.map((manifest) => {
      return (
        <LauncherAppIcon
          key={manifest.identifier}
          appType={AppAPI.getAppType(manifest)}
          manifest={manifest}
          manageable={this.state.manageable}
        />
      );
    });

    return (
      <div className='launcher-app-grid' onClick={this.leaveManageMode.bind(this)}>
        <LauncherSortable
          onClick={this.leaveManageMode.bind(this)}
          onLongPressIcon={this.enterManageMode.bind(this)}
          onSort={this.handleSort.bind(this)}
          onUninstall={this.handleUninstall.bind(this)}
          manageable={this.state.manageable}
        >
          {appIcons}
        </LauncherSortable>
        <Dialog.Container
          ref="alertDialog"
          onDeny={this.handleUninstallNegative.bind(this)}
          onApprove={this.handleUninstallAffirmative.bind(this)}
        >
          <Dialog.Header>{this.state.alertTitle}</Dialog.Header>
          <Dialog.Content>
            {this.state.alertMessage}
          </Dialog.Content>
          <Dialog.ButtonSet>
            <Button style="labeled icon" icon="remove" color="red" classes="deny">
              No
            </Button>
            <Button style="labeled icon" icon="checkmark" color="green" classes="approve">
              Yes
            </Button>
          </Dialog.ButtonSet>
        </Dialog.Container>
      </div>
    );
  }
}
