var AlertViewController    = require('framework/cutie/AlertView/js/AlertViewController.jsx');
var LauncherAppIcon        = require('./LauncherAppIcon.jsx');
var LauncherSortable       = require('./LauncherSortable.jsx');
var LauncherConstants      = require('../constants/LauncherConstants');
var LauncherActionCreators = require('../actions/LauncherActionCreators');
var LauncherStore          = require('../stores/LauncherStore');

var DiligentAgentMixin = {
    diligentClientWillLaunch: function() {

    },

    diligentClientDidLaunch: function() {
        AppManagerAgent.list();
    },

    diligentClientWillTerminate: function() {

    },

    diligentClientDidTerminate: function() {

    },

    diligentConnectionDidFail: function() {

    }
};

var AppManagerAgentMixin = {
    appListDidReceive: function(apps) {
        LauncherActionCreators.sortAppList(apps);
    },

    appWillInstall: function(instInfo) {

    },

    appIsUploading: function(instInfo) {

    },

    appIsInstalling: function(instInfo) {

    },

    appDidInstall: function(instInfo) {

    },

    appInstallDidFail: function(instInfo) {

    },

    appWillCancelInstall: function(instInfo) {

    },

    appDidCancelInstall: function(instInfo) {

    },

    appCancelInstallDidFail: function(instInfo) {

    },

    appWillUninstall: function(uninstInfo) {

    },

    appDidUninstall: function(uninstInfo) {
        LauncherActionCreators.removeAppFromSortList(uninstInfo.manifest);
    },

    appUninstallDidFail: function(uninstInfo) {

    }
};

var AppMainView = React.createClass({

    mixins: [
        DiligentAgentMixin,
        AppManagerAgentMixin
    ],

    getInitialState: function() {
        return {
            appList: [],
            manageable: false,
            /* AlertView parameters */
            alertTitle: '',
            alertMessage: ''
        };
    },

    componentWillMount: function() {
        LauncherStore.addChangeListener(this._onLauncherChanges);
        LauncherStore.addErrorListener(this._onLauncherError);
        DiligentAgent.attach(this);
        AppManagerAgent.attach(this);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        AppManagerAgent.detach(this);
        DiligentAgent.detach(this);
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
            var type = AppManagerAgent.getAppType(manifest);

            if (type === 'builtin') {
                return (
                    <LauncherAppIcon key = {manifest.directory}
                                 appType = 'b'
                                manifest = {manifest}
                              manageable = {this.state.manageable} />
                );
            }
            else if (type === 'user')
                return (
                    <LauncherAppIcon key = {manifest.directory}
                                 appType = 'u'
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
                <AlertViewController ref = 'alertViewController'
                                   title = {this.state.alertTitle}
                                 message = {this.state.alertMessage}
                           actionButtons = {[{
                                                title: "No",
                                                iconType: "remove",
                                                color: "red",
                                                actionType: "deny",
                                                onClick: this._handleUninstallNegative
                                            },
                                            {
                                                title: "Yes",
                                                iconType: "checkmark",
                                                color: "green",
                                                actionType: "approve",
                                                onClick: this._handleUninstallAffirmative
                                            }]} />
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

    _handleUninstall: function(dir) {
        this._manifest = AppManagerAgent.getAppManifest(dir);
        this.setState({
            alertTitle: 'Uninstall APP',
            alertMessage: 'Are you sure to uninstall ' + this._manifest.name + ' ?'
        });
        this.refs.alertViewController.show();
    },

    _handleUninstallAffirmative: function(e) {
        e.stopPropagation();
        AppManagerAgent.uninstall(this._manifest);
    },

    _handleUninstallNegative: function(e) {
        e.stopPropagation();
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
