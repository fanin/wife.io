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
        LauncherActionCreators.listApps();
    },

    diligentClientWillTerminate: function() {

    },

    diligentClientDidTerminate: function() {

    },

    diligentConnectionDidFail: function() {

    }
};

var AppMainView = React.createClass({

    mixins: [ DiligentAgentMixin ],

    getInitialState: function() {
        return {
            appList: [],
            manageable: false,
            /* AlertView parameters */
            alertTitle: '',
            alertDescription: ''
        };
    },

    componentWillMount: function() {
        LauncherStore.addChangeListener(this._onLauncherChanges);
        LauncherStore.addErrorListener(this._onLauncherError);
        DiligentAgent.attach(this);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        DiligentAgent.detach(this);
        LauncherStore.removeErrorListener(this._onLauncherError);
        LauncherStore.removeChangeListener(this._onLauncherChanges);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        if (this.state.manageable && !nextState.manageable)
            LauncherActionCreators.writeAppList(this.state.appList);
        return true;
    },

    render: function() {
        var appIcons = this.state.appList.map(function(manifest) {
            var type = LauncherStore.getAppType(manifest);

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
                             description = {this.state.alertDescription}
                     onActionAffirmative = {this._handleUninstallAffirmative}
                        onActionNegative = {this._handleUninstallNegative} />
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
        this.setState({appList: newList});
    },

    _handleUninstall: function(dir) {
        this._manifest = LauncherStore.getAppManifest(dir);
        this.setState({
            alertTitle: 'Uninstall APP',
            alertDescription: 'Are you sure to uninstall ' + this._manifest.name + ' ?'
        });
        this.refs.alertViewController.show();
    },

    _handleUninstallAffirmative: function(e) {
        e.stopPropagation();
        LauncherActionCreators.removeApp(this._manifest);
    },

    _handleUninstallNegative: function(e) {
        e.stopPropagation();
    },

    _onLauncherChanges: function(changes) {
        switch (changes.type) {
            case LauncherConstants.LAUNCHER_APP_LIST:
                this.setState({ appList: LauncherStore.getAppList() });
                break;
            case LauncherConstants.LAUNCHER_APP_UNINSTALL_SUCCESS:
                this._manifest = null;
                this.setState({ appList: LauncherStore.getAppList() });
                break;
            case LauncherConstants.LAUNCHER_APP_WRITE_SORT_LIST:
                break;
            case LauncherConstants.LAUNCHER_APP_ENTER_MANAGE_MODE:
                this.setState({ manageable: true });
                break;
            case LauncherConstants.LAUNCHER_APP_LEAVE_MANAGE_MODE:
                this.setState({ manageable: false });
                break;
            case LauncherConstants.LAUNCHER_APP_ICON_MOVE:
                break;
        }
    },

    _onLauncherError: function(error) {
        switch (error.type) {
            case LauncherConstants.LAUNCHER_APP_LIST:
                break;
            case LauncherConstants.LAUNCHER_APP_UNINSTALL:
                alert(error.type);
                break;
            case LauncherConstants.LAUNCHER_APP_WRITE_SORT_LIST:
                break;
        }
    }
});

module.exports = AppMainView;
