var DialogController       = require('lib/cutie/Dialog');
var AppAPI                 = require('lib/api/AppAPI');
var LauncherAppIcon        = require('./LauncherAppIcon.jsx');
var LauncherSortable       = require('./LauncherSortable.jsx');
var LauncherConstants      = require('../constants/LauncherConstants');
var LauncherActionCreators = require('../actions/LauncherActionCreators');
var LauncherStore          = require('../stores/LauncherStore');

var AppMainView = React.createClass({

    getInitialState: function() {
        return {
            appList: [],
            manageable: false,
            alertTitle: '',
            alertMessage: ''
        };
    },

    componentWillMount: function() {
        LauncherStore.addChangeListener(this._onLauncherChanges);
        LauncherStore.addErrorListener(this._onLauncherError);

        AppAPI.list({
            onSuccess: function(list) {
                LauncherActionCreators.sortAppList(list);
            },
            onError: function(error) {
                console.log('Unable to get app list, error: ' + error.message);
            }
        });
    },

    componentWillUnmount: function() {
        LauncherStore.removeErrorListener(this._onLauncherError);
        LauncherStore.removeChangeListener(this._onLauncherChanges);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        if (this.state.manageable && !nextState.manageable)
            LauncherActionCreators.writeSortedAppList(this.state.appList);
        return true;
    },

    render: function() {
        var appIcons = this.state.appList.map(function(manifest) {
            return (
                <LauncherAppIcon key = {manifest.identifier}
                             appType = {AppAPI.getAppType(manifest)}
                            manifest = {manifest}
                          manageable = {this.state.manageable} />
            );
        }, this);

        return (
            <div className='launcher-app-grid' onClick={this._leaveManageMode}>
                <LauncherSortable onClick = {this._leaveManageMode}
                          onLongPressIcon = {this._enterManageMode}
                                   onSort = {this._handleSort}
                              onUninstall = {this._handleUninstall}
                               manageable = {this.state.manageable}>
                    {appIcons}
                </LauncherSortable>
                <DialogController ref = 'alertDialog'
                                title = {this.state.alertTitle}
                              message = {this.state.alertMessage}
                        actionButtons = {[{
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
                              onDeny = {this._handleUninstallNegative}
                           onApprove = {this._handleUninstallAffirmative} />
            </div>
        );
    },

    _enterManageMode: function() {
        LauncherActionCreators.manageApps(true);
    },

    _leaveManageMode: function() {
        LauncherActionCreators.manageApps(false);
    },

    _handleSort: function(newOrder) {
        var newList = newOrder.map(function(index) {
            return this.state.appList[index];
        }.bind(this));
        this.setState({ appList: newList });
    },

    _handleUninstall: function(appid) {
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
    },

    _handleUninstallAffirmative: function() {
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
    },

    _handleUninstallNegative: function() {

    },

    _onLauncherChanges: function(changes) {
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
    },

    _onLauncherError: function(error) {
        switch (error.type) {
            case LauncherConstants.LAUNCHER_WRITE_SORT_APP_LIST:
                break;
            case LauncherConstants.LAUNCHER_REMOVE_APP_FROM_SORT_LIST:
                break;
        }
    }
});

module.exports = AppMainView;
