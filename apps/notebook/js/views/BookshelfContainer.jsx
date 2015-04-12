var JqTreeView             = require('./JqTreeView.jsx');
var NotebookConstants      = require('../constants/NotebookConstants');
var DatabaseStore          = require('../stores/DatabaseStore');
var StorageStore           = require('../stores/StorageStore');
var DatabaseActionCreators = require('../actions/DatabaseActionCreators');
var StorageActionCreators  = require('../actions/StorageActionCreators');

var BookshelfContainer = React.createClass({

    getInitialState: function() {
        return {
            disks: [],
            treeData: []
        };
    },

    componentWillMount: function() {
        DiligentAgent.on('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.on('agent.client.stop', this._onDiligentClientStop);
        DatabaseStore.addChangeListener(this._onDatabaseChange);
        StorageStore.addChangeListener(this._onStorageChange);
    },

    componentDidMount: function() {
        $(".nb-toolbar-disksel-dropdown").dropdown({
            transition: 'drop',
            onChange: function(value, text, $selectedItem) {
                var _disk = StorageStore.getDiskByUUID(value);
                StorageActionCreators.setDiskInUse(_disk);
            }
        });
    },

    componentWillUnmount: function() {
        StorageStore.removeChangeListener(this._onStorageChange);
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
        DiligentAgent.off('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.off('agent.client.stop', this._onDiligentClientStop);
    },

    _onDiligentClientReady: function() {
        StorageActionCreators.list();
        DatabaseActionCreators.loadTree();
        DiligentAgent.getClient().notificationCenter.addObserver("system.storage", "disk.inuse.change", this._onDiskInUseChange);
    },

    _onDiligentClientStop: function() {
        DiligentAgent.getClient().notificationCenter.removeObserver("system.storage", "disk.inuse.change", this._onDiskInUseChange);
    },

    _onDiskInUseChange: function(disk) {
        DatabaseActionCreators.loadTree();
    },

    _onDatabaseChange: function(change) {
        if (change === NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS) {
            this.setState({ treeData: DatabaseStore.getTreeData() });
        }
        else if (change === NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR) {
            // TODO: show error
            console.log(DatabaseStore.getError());
        }
    },

    _onStorageChange: function(change) {
        this.setState({ disks: StorageStore.getDisks() });

        switch (change) {
            case NotebookConstants.NOTEBOOK_APP_STORAGE_LIST:
            case NotebookConstants.NOTEBOOK_APP_STORAGE_ADD:
                break;
            case NotebookConstants.NOTEBOOK_APP_STORAGE_REMOVE:
            case NotebookConstants.NOTEBOOK_APP_STORAGE_SET_DISK_INUSE:
        }
    },

    render: function() {
        var diskMenuItems = this.state.disks.map(function(disk) {
            var iconClass = StorageStore.isDiskInUse(disk) ? "check icon" : "icon";
            return (
                <div className="item" data-value={disk.uuid} data-text={disk.name}>
                    <i className={iconClass}></i>
                    {disk.name + " (" + disk.type + ")"}
                </div>
            );
        });

        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <div className="ui pointing dropdown item nb-toolbar-disksel-dropdown">
                        <i className="disk outline icon"></i>
                        <div className="menu">
                            {diskMenuItems}
                        </div>
                    </div>
                    <div className="ui pointing link item">
                        <i className="plus icon"></i>
                        New
                    </div>
                    <div className="ui pointing link item">
                        <i className="write icon"></i>
                        Rename
                    </div>
                    <div className="ui pointing link item">
                        <i className="trash outline icon"></i>
                        Trash
                    </div>
                </div>
                <div className="nb-column-content">
                    <JqTreeView data={this.state.treeData} exclusives={[ "All Notes" ]} />
                </div>
            </div>
        );
    }

});

module.exports = BookshelfContainer;
