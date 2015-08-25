import AppAPI from 'lib/api/AppAPI';
import DialogController from 'lib/cutie/Dialog';
import LauncherAppIcon from './LauncherAppIcon.jsx';
import LauncherSortable from './LauncherSortable.jsx';
import LauncherConstants from '../constants/LauncherConstants';
import LauncherActionCreators from '../actions/LauncherActionCreators';
import LauncherStore from '../stores/LauncherStore';

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
    if (this.state.manageable && !nextState.manageable)
      LauncherActionCreators.writeSortedAppList(this.state.appList);
    return true;
  }

  enterManageMode() {
    LauncherActionCreators.manageApps(true);
  }

  leaveManageMode() {
    LauncherActionCreators.manageApps(false);
  }

  handleSort(newOrder) {
    var newList = newOrder.map(function(index) {
      return this.state.appList[index];
    }.bind(this));
    this.setState({ appList: newList });
  }

  handleUninstall(appid) {
    AppAPI.getAppByID(appid, {
      onSuccess: function(manifest) {
        this._manifest = manifest;
        this.setState({
          alertTitle: 'Uninstall APP',
          alertMessage: 'Are you sure to uninstall ' + this._manifest.name + ' ?'
        });
        this.refs.alertDialog.show();
      }.bind(this),
      onError: function(error) {
        console.log('Unable to get app, error: ' + error.message);
      }
    });
  }

  handleUninstallAffirmative() {
    AppAPI.uninstall(this._manifest, 0, {
      onSuccess: function() {
        LauncherActionCreators.removeAppFromSortList(this._manifest);
      }.bind(this),
      onError: function(error) {
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
    let appIcons = this.state.appList.map(function(manifest) {
      return (
        <LauncherAppIcon
          key={manifest.identifier}
          appType={AppAPI.getAppType(manifest)}
          manifest={manifest}
          manageable={this.state.manageable}
        />
      );
    }, this);

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
        <DialogController
          ref='alertDialog'
          title={this.state.alertTitle}
          message={this.state.alertMessage}
          actionButtons={[{
              title: "No",
              iconType: "remove",
              color: "red",
              actionType: "deny"
            },
            {
              title: "Yes",
              iconType: "checkmark",
              color: "green",
              actionType: "approve"
            }]}
          onDeny={this.handleUninstallNegative.bind(this)}
          onApprove={this.handleUninstallAffirmative.bind(this)}
        />
      </div>
    );
  }
}
