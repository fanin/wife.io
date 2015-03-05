var LauncherConstants      = require('../constants/LauncherConstants');
var LauncherActionCreators = require('../actions/LauncherActionCreators');
var LauncherStore          = require('../stores/LauncherStore');
var DiligentStore          = DiligentAgent.store;

var LauncherAppIcon = React.createClass({
    propTypes: {
        appType: React.PropTypes.string.isRequired,
        manifest: React.PropTypes.object.isRequired,
        manageable: React.PropTypes.bool
    },

    componentDidMount: function() {
        document.getElementById('launcher-icon-div-' + this.props.manifest.directory).draggable = false;
        document.getElementById('launcher-icon-img-' + this.props.manifest.directory).draggable = false;
        document.getElementById('launcher-icon-text-' + this.props.manifest.directory).draggable = false;
    },

    render: function() {
        var iconAHref = '/apps/' + this.props.appType + '/' + this.props.manifest.directory + '/' + this.props.manifest.entry;

        var iconDivStyle = (this.props.appType === 'u') ? {
            backgroundImage:
                'url(/apps/u/' + this.props.manifest.directory + '/img/icon.png) no-repeat; background-size: contain;'
        } : {};

        var iconImgStyle = {
            width: '100%',
            height: '100%'
        };

        var iconImgSrc = '/apps/' + this.props.appType + '/' + this.props.manifest.directory + '/img/icon.png';

        return (
            <li id={'launcher-icon-li-' + this.props.manifest.directory} key={this.props.manifest.directory}>
                <a id    = {'launcher-icon-a-' + this.props.manifest.directory}
                   href  = {this.props.manageable ? '#' : iconAHref}
                   title = {(this.props.manageable && this.props.appType === 'u') ?
                            'Uninstall ' + this.props.manifest.name :
                            this.props.manifest.description}>

                    <div id        = {'launcher-icon-div-' + this.props.manifest.directory}
                         style     = {iconDivStyle}
                         className = {this.props.manageable ? 'shake-app' : ''}>

                        <img id    = {'launcher-icon-img-' + this.props.manifest.directory}
                             style = {iconImgStyle}
                             src   = {iconImgSrc} />

                        <div id        = {'launcher-overlay-icon-div-' + this.props.manifest.directory}
                             className = 'launcher-overlay-icon-delete'
                             style     = {{display: (this.props.appType === 'u' && this.props.manageable) ? 'block' : 'none'}}>

                            <img id  = {'launcher-overlay-icon-img-' + this.props.manifest.directory}
                                 src = 'img/delete-icon.png'/>
                        </div>
                    </div>
                    <span id = {'launcher-icon-text-' + this.props.manifest.directory}>
                        {this.props.manifest.name}
                    </span>
                </a>
            </li>
        );
    }
});

var __builtinAppClickTimer;
var __userAppClickTimer;
var __longPressTimer;
var cloneWithProps = React.addons.cloneWithProps;

var LauncherSortable = React.createClass({
    getDefaultProps: function() {
        return { component: "ul", childComponent: "li" };
    },

    propTypes: {
        manageable: React.PropTypes.bool
    },

    render: function() {
        var props = jQuery.extend({}, this.props);
        delete props.children;
        return React.createElement(this.props.component, props);
    },

    componentDidMount: function() {
        $(this.getDOMNode()).sortable({stop: this._handleDrop});
        $(this.getDOMNode()).disableSelection();
    },

    componentDidUpdate: function() {
        var childIndex = 0;
        var nodeIndex = 0;
        var children = this.getChildren();
        var nodes = $(this.getDOMNode()).children();
        var numChildren = children.length;
        var numNodes = nodes.length;

        while (childIndex < numChildren) {
            if (nodeIndex >= numNodes) {
                $(this.getDOMNode()).append('<' + this.props.childComponent + '/>');
                var appType = children[childIndex].props.appType;
                var node = $(this.getDOMNode()).children().last()[0];

                node.manifest    = children[childIndex].props.manifest;
                node.onmousedown = (appType === 'b') ? this._handleMouseDown_b : this._handleMouseDown_u;
                node.onmouseup   = (appType === 'b') ? this._handleMouseUp_b   : this._handleMouseUp_u;
                node.onmousemove = (appType === 'b') ? this._handleMouseMove_b : this._handleMouseMove_u;
                node.onclick     = this._handleDefaultClick;

                nodes.push(node);
                nodes[numNodes].dataset.reactSortablePos = numNodes;
                numNodes++;
            }
            var child = cloneWithProps(children[childIndex]);
            React.render(child, nodes[nodeIndex]);
            childIndex++;
            nodeIndex++;
        }

        while (nodeIndex < numNodes) {
            React.unmountComponentAtNode(nodes[nodeIndex]);
            $(nodes[nodeIndex]).remove();
            nodeIndex++;
        }

        if (this.props.manageable)
            $(this.getDOMNode()).sortable('enable');
        else
            $(this.getDOMNode()).sortable('disable');
    },

    componentWillUnmount: function() {
        $(this.getDOMNode()).children().get().forEach(function(node) {
            React.unmountComponentAtNode(node);
        });
    },

    getChildren: function() {
        // TODO: use mapChildren()
        return this.props.children || [];
    },

    _handleDrop: function() {
        var newOrder = $(this.getDOMNode()).children().get().map(function(child, i) {
            var rv = child.dataset.reactSortablePos;
            child.dataset.reactSortablePos = i;
            return rv;
        });
        this.props.onSort(newOrder);
    },

    _handleMouseDown_b: function(e) {
        __builtinAppClickTimer = setTimeout(function() {
            __builtinAppClickTimer = undefined;
        }, 500);
        this._startManageModeTimer();
    },

    _handleMouseUp_b: function(e) {
        if (__builtinAppClickTimer) {
            e.stopPropagation();
            if (this.props.manageable) {
                e.preventDefault();
            }
        }
        this._stopManageModeTimer();
    },

    _handleMouseMove_b: function(e) {
        clearTimeout(__builtinAppClickTimer);
        __builtinAppClickTimer = undefined;
        this._stopManageModeTimer();
    },

    _handleMouseDown_u: function(e) {
        __userAppClickTimer = setTimeout(function() {
            __userAppClickTimer = undefined;
        }, 500);
        this._startManageModeTimer();
    },

    _handleMouseUp_u: function(e) {
        if (__userAppClickTimer) {
            e.stopPropagation();
            if (this.props.manageable) {
                var dir = e.target.id.split('-').pop();
                this.props.onUninstall(dir);
            }
        }
        this._stopManageModeTimer();
    },

    _handleMouseMove_u: function(e) {
        clearTimeout(__userAppClickTimer);
            __userAppClickTimer = undefined;
        this._stopManageModeTimer();
    },

    _handleDefaultClick: function(e) {
        if (this.props.manageable) {
            e.preventDefault();
            e.stopPropagation();
        }
    },

    _startManageModeTimer: function() {
        if (!this.props.manageable) {
            __longPressTimer = setTimeout(function() {
                this.props.onLongPressIcon();
            }.bind(this), 750);
        }
    },

    _stopManageModeTimer: function() {
        if (__longPressTimer)
            clearTimeout(__longPressTimer);
    }
});

var LauncherApp = React.createClass({
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
        DiligentStore.addDiligentListener(this._onDiligentChanges);
        LauncherStore.addChangeListener(this._onLauncherChanges);
        LauncherStore.addErrorListener(this._onLauncherError);
    },

    componentDidMount: function() {

    },

    componentWillUnmount: function() {
        LauncherStore.removeErrorListener(this._onLauncherError);
        LauncherStore.removeChangeListener(this._onLauncherChanges);
        DiligentStore.removeDiligentListener(this._onDiligentChanges);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        if (this.state.manageable && !nextState.manageable)
            LauncherActionCreators.writeAppList(this.state.appList);
        return true;
    },

    componentWillUpdate: function(nextProps, nextState) {

    },

    componentDidUpdate: function(prevProps, prevState) {

    },

    render: function() {
        var appIcons = this.state.appList.map(function(manifest) {
            var type = LauncherStore.getAppType(manifest);

            if (type === 'builtin') {
                return (
                    <LauncherAppIcon
                        key        = {manifest.directory}
                        appType    = 'b'
                        manifest   = {manifest}
                        manageable = {this.state.manageable} />
                );
            }
            else if (type === 'user')
                return (
                    <LauncherAppIcon
                        key        = {manifest.directory}
                        appType    = 'u'
                        manifest   = {manifest}
                        manageable = {this.state.manageable} />
                );
        }, this);

        return (
            <div className='launcher-app-grid' onClick={this._leaveManageMode}>
                <LauncherSortable onClick         = {this._leaveManageMode}
                                  onLongPressIcon = {this._enterManageMode}
                                  onSort          = {this._handleSort}
                                  onUninstall     = {this._handleUninstall}
                                  manageable      = {this.state.manageable}>
                    {appIcons}
                </LauncherSortable>
                <AlertView ref                 = 'alertView'
                           title               = {this.state.alertTitle}
                           description         = {this.state.alertDescription}
                           onActionAffirmative = {this._handleUninstallAffirmative}
                           onActionNegative    = {this._handleUninstallNegative} />
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
        this.refs.alertView.show();
    },

    _handleUninstallAffirmative: function(e) {
        e.stopPropagation();
        LauncherActionCreators.removeApp(this._manifest);
    },

    _handleUninstallNegative: function(e) {
        e.stopPropagation();
    },

    _onDiligentChanges: function() {
        switch (DiligentStore.getClient().status) {
            case DiligentConstants.DILIGENT_CLIENT_INITIATE:
                break;
            case DiligentConstants.DILIGENT_CLIENT_RUNNING:
                break;
            case DiligentConstants.DILIGENT_CLIENT_TERMINATE:
                break;
            case DiligentConstants.DILIGENT_CONNECTION_ESTABLISHED:
                break;
            case DiligentConstants.DILIGENT_CONNECTION_CLOSED:
                break;
            case DiligentConstants.DILIGENT_CONNECT_FAIL:
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
                LauncherActionCreators.listApps();
                break;
            case DiligentConstants.DILIGENT_WSAPI_LOAD_FAIL:
                break;
        }
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

module.exports = LauncherApp;
