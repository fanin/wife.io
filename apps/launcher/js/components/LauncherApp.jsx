var LauncherConstants      = require('../constants/LauncherConstants');
var LauncherActionCreators = require('../actions/LauncherActionCreators');
var LauncherStore          = require('../stores/LauncherStore');
var DiligentStore          = DiligentAgent.store;

var LauncherAppIcon = React.createClass({
    propTypes: {
        appType: React.PropTypes.string.isRequired,
        manifest: React.PropTypes.object.isRequired,
        manageMode: React.PropTypes.bool
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
                   href  = {this.props.manageMode ? '#' : iconAHref}
                   title = {(this.props.manageMode && this.props.appType === 'u') ?
                            'Delete' + this.props.manifest.name :
                            this.props.manifest.description}>

                    <div id        = {'launcher-icon-div-' + this.props.manifest.directory}
                         style     = {iconDivStyle}
                         className = {this.props.manageMode ? 'shake-app' : ''}>

                        <img id    = {'launcher-icon-img-' + this.props.manifest.directory}
                             style = {iconImgStyle}
                             src   = {iconImgSrc} />

                        <div id        = {'launcher-overlay-icon-div-' + this.props.manifest.directory}
                             className = 'launcher-overlay-icon-delete'
                             style     = {{display: (this.props.appType === 'u' && this.props.manageMode) ? 'block' : 'none'}}>

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
        return {component: "ul", childComponent: "li"};
    },

    propTypes: {
        manageMode: React.PropTypes.bool
    },

    render: function() {
        var props = jQuery.extend({}, this.props);
        delete props.children;
        return React.createElement(this.props.component, props);
    },

    componentDidMount: function() {
        jQuery(this.getDOMNode()).sortable({stop: this.handleDrop});
        jQuery(this.getDOMNode()).disableSelection();
    },

    componentDidUpdate: function() {
        var childIndex = 0;
        var nodeIndex = 0;
        var children = this.getChildren();
        var nodes = jQuery(this.getDOMNode()).children();
        var numChildren = children.length;
        var numNodes = nodes.length;

        while (childIndex < numChildren) {
            if (nodeIndex >= numNodes) {
                jQuery(this.getDOMNode()).append('<' + this.props.childComponent + '/>');
                var appType = children[childIndex].props.appType;
                var node = jQuery(this.getDOMNode()).children().last()[0];

                node.manifest    = children[childIndex].props.manifest;
                node.onmousedown = (appType === 'b') ? this.handleMouseDown_b : this.handleMouseDown_u;
                node.onmouseup   = (appType === 'b') ? this.handleMouseUp_b : this.handleMouseUp_u;
                node.onmousemove = (appType === 'b') ? this.handleMouseMove_b : this.handleMouseMove_u;
                node.onclick     = this.handleDefaultClick;

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
            jQuery(nodes[nodeIndex]).remove();
            nodeIndex++;
        }

        if (this.props.manageMode)
            jQuery(this.getDOMNode()).sortable('enable');
        else
            jQuery(this.getDOMNode()).sortable('disable');
    },

    componentWillUnmount: function() {
        jQuery(this.getDOMNode()).children().get().forEach(function(node) {
            React.unmountComponentAtNode(node);
        });
    },

    getChildren: function() {
        // TODO: use mapChildren()
        return this.props.children || [];
    },

    handleDrop: function() {
        var newOrder = jQuery(this.getDOMNode()).children().get().map(function(child, i) {
            var rv = child.dataset.reactSortablePos;
            child.dataset.reactSortablePos = i;
            return rv;
        });
        this.props.onSort(newOrder);
    },

    handleMouseDown_b: function(e) {
        __builtinAppClickTimer = setTimeout(function() {
            __builtinAppClickTimer = undefined;
        }, 500);
        this.startManageModeTimer();
    },

    handleMouseUp_b: function(e) {
        if (__builtinAppClickTimer)
            this.clickAppIcon(e);
        this.stopManageModeTimer();
    },

    handleMouseMove_b: function(e) {
        clearTimeout(__builtinAppClickTimer);
        __builtinAppClickTimer = undefined;
        this.stopManageModeTimer();
    },

    handleMouseDown_u: function(e) {
        __userAppClickTimer = setTimeout(function() {
            __userAppClickTimer = undefined;
        }, 500);
        this.startManageModeTimer();
    },

    handleMouseUp_u: function(e) {
        if (__userAppClickTimer)
            this.clickDeleteApp(e);
        this.stopManageModeTimer();
    },

    handleMouseMove_u: function(e) {
        clearTimeout(__userAppClickTimer);
            __userAppClickTimer = undefined;
        this.stopManageModeTimer();
    },

    handleDefaultClick: function(e) {
        if (this.props.manageMode) {
            e.preventDefault();
            e.stopPropagation();
        }
    },

    startManageModeTimer: function() {
        if (!this.props.manageMode) {
            __longPressTimer = setTimeout(function() {
                LauncherActionCreators.manageApps(true);
            }, 750);
        }
    },

    stopManageModeTimer: function() {
        if (__longPressTimer)
            clearTimeout(__longPressTimer);
    },

    clickAppIcon: function(e) {
        e.stopPropagation();
        if (this.props.manageMode) {
            e.preventDefault();
        }
    },

    clickDeleteApp: function(e) {
        e.stopPropagation();
        if (this.props.manageMode) {
            if (confirm('Are you sure?')) {
                var dir = e.target.id.split('-').pop();
                var manifest = LauncherStore.getAppManifest(dir);
                LauncherActionCreators.removeApp(manifest);
            }
        }
    }
});

var LauncherApp = React.createClass({
    getInitialState: function() {
        return {
            appList: [],
            manageMode: false
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
        if (this.state.manageMode && !nextState.manageMode)
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
                        manageMode = {this.state.manageMode} />
                );
            }
            else if (type === 'user')
                return (
                    <LauncherAppIcon
                        key        = {manifest.directory}
                        appType    = 'u'
                        manifest   = {manifest}
                        manageMode = {this.state.manageMode} />
                );
        }, this);

        return (
            <div className='launcher-app-grid' onClick={this._leaveManageMode}>
                <LauncherSortable onClick    = {this._leaveManageMode}
                                  onSort     = {this._handleSort}
                                  manageMode = {this.state.manageMode}>
                    {appIcons}
                </LauncherSortable>
            </div>
        );
    },

    _handleSort: function(newOrder) {
        var newList = newOrder.map(function(index) {
            return this.state.appList[index];
        }.bind(this));
        this.setState({appList: newList});
    },

    _leaveManageMode: function(e) {
        LauncherActionCreators.manageApps(false);
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
                this.setState({ appList: LauncherStore.getAppList() });
                break;
            case LauncherConstants.LAUNCHER_APP_WRITE_SORT_LIST:
                break;
            case LauncherConstants.LAUNCHER_APP_ENTER_MANAGE_MODE:
                this.setState({ manageMode: true });
                break;
            case LauncherConstants.LAUNCHER_APP_LEAVE_MANAGE_MODE:
                this.setState({ manageMode: false });
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
