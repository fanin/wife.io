var AlertViewController      = require('framework/cutie/AlertView/js/AlertViewController.jsx');
var StorageStore             = require("framework/diligent/modules/storage/stores/StorageStore");
var StorageActionCreators    = require("framework/diligent/modules/storage/actions/StorageActionCreators");
var JqTreeViewController     = require("./JqTreeViewController.jsx");
var InputModalViewController = require("./InputModalViewController.jsx");
var NotebookConstants        = require("../constants/NotebookConstants");
var DatabaseStore            = require("../stores/DatabaseStore");
var DatabaseActionCreators   = require("../actions/DatabaseActionCreators");

var notebookInputRules = [
    {
        type   : "empty",
        prompt : "Notebook name is empty"
    },
    {
        type   : "hasSpecialChar",
        prompt : "Only underline (_) is allowed special character"
    }
];

var BookshelfContainer = React.createClass({

    getInitialState: function() {
        return {
            disks: [],
            treeData: [],
            inputDialogTitle: '',
            inputDialogDefaultValue: '',
            inputDialogOnAffirmative: null,
            disableRenameButton: false,
            disableTrashButton: false
        };
    },

    componentWillMount: function() {
        DiligentAgent.on("agent.client.ready", this._onDiligentClientReady);
        DiligentAgent.on("agent.client.stop", this._onDiligentClientStop);
        DatabaseStore.addChangeListener(this._onDatabaseChange);
        StorageStore.addChangeListener(this._onStorageChange);

        $.fn.form.settings.rules.checkLength = function(text) {
            return (text.length >= 2 && text.length <= 32);
        };

        $.fn.form.settings.rules.hasSpecialChar = function(text) {
            var regExp = /[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/;
            return !regExp.test(text);
        };
    },

    componentDidMount: function() {
        $(".nb-toolbar-disksel-dropdown").dropdown({
            transition: "drop",
            onChange: function(value, text, $selectedItem) {
                var _disk = StorageStore.getDiskByUUID(value);
                StorageActionCreators.setDiskInUse(_disk);
            }
        });
    },

    componentWillUnmount: function() {
        StorageStore.removeChangeListener(this._onStorageChange);
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
        DiligentAgent.off("agent.client.ready", this._onDiligentClientReady);
        DiligentAgent.off("agent.client.stop", this._onDiligentClientStop);
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

        var renameButtonClass = this.state.disableRenameButton ? "ui pointing link disabled item"
                                                               : "ui pointing link item";
        var trashButtonClass = this.state.disableTrashButton ? "ui pointing link disabled item"
                                                             : "ui pointing link item";

        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <div className="ui pointing dropdown item nb-toolbar-disksel-dropdown">
                        <i className="disk outline icon"></i>
                        <div className="menu">
                            {diskMenuItems}
                        </div>
                    </div>
                    <div className="ui pointing link item" onClick={this._createNotebookInputDialog}>
                        <i className="plus icon"></i>
                        New
                    </div>
                    <div className={renameButtonClass} onClick={this._renameInputDialog}>
                        <i className="write icon"></i>
                        Rename
                    </div>
                    <div className={trashButtonClass} onClick={this._trashConfirmDialog}>
                        <i className="trash outline icon"></i>
                        Trash
                    </div>
                </div>
                <div className="nb-column-content">
                    <JqTreeViewController ref = "treeViewController"
                                         data = {this.state.treeData}
                                   exclusives = {[ 1 ]}
                               onCreateFolder = {this._createStackInputDialog}
                                       onInit = {this._onTreeSelect}
                                       onOpen = {this._saveTree}
                                      onClose = {this._saveTree}
                                       onMove = {this._saveTree}
                                     onSelect = {this._onTreeSelect} />
                </div>
                <InputModalViewController ref = "inputViewController"
                                        title = {this.state.inputDialogTitle}
                                 defaultValue = {this.state.inputDialogDefaultValue}
                                        rules = {notebookInputRules}
                          onActionAffirmative = {this.state.inputDialogOnAffirmative} />
                {
                // BUG
                }
                <AlertViewController ref = 'alertViewController'
                                   title = {this.state.alertTitle}
                             description = {this.state.alertDescription}
                     onActionAffirmative = {this._trashSelected} />
            </div>
        );
    },

    _onDiligentClientReady: function() {
        StorageActionCreators.listenNotifications();
        StorageActionCreators.list();
        DatabaseActionCreators.loadTree();
        DiligentAgent.getClient().notificationCenter.addObserver(
            "system.storage",
            "disk.inuse.change",
            this._onDiskInUseChange
        );
    },

    _onDiligentClientStop: function() {
        DiligentAgent.getClient().notificationCenter.removeObserver(
            "system.storage",
            "disk.inuse.change",
            this._onDiskInUseChange
        );
    },

    _onDiskInUseChange: function(disk) {
        DatabaseActionCreators.loadTree();
    },

    _onDatabaseChange: function(change) {
        switch (change) {
            case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS:
                this.setState({ treeData: DatabaseStore.getTreeData() });
                break;
            case NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE_SUCCESS:
                break;
            case NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_STACK:
                var stack = DatabaseStore.getCreatedStack();
                this.treeViewCreateFolderHelper(stack.id, stack.name);
                this.treeViewCreateFolderHelper = undefined;
                this._saveTree();
                break;
            case NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_SUCCESS:
                var nb = DatabaseStore.getCreatedNotebook();
                this.refs.treeViewController.nodeCreate(nb.id, nb.name);
                this._saveTree();
                break;
            case NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_SUCCESS:
                var nb = DatabaseStore.getTrashedNotebook();
                this.refs.treeViewController.nodeRemove(nb.id);
                this._saveTree();
                break;
            case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR:
            case NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE_ERROR:
            case NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_ERROR:
            case NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_ERROR:
                // TODO: show error
                console.log(DatabaseStore.getError());
                break;
        }
    },

    _onStorageChange: function(change) {
        this.setState({ disks: StorageStore.getDisks() });

        switch (change) {
            case NotebookConstants.STORAGE_LIST:
            case NotebookConstants.STORAGE_ADD:
            case NotebookConstants.STORAGE_REMOVE:
            case NotebookConstants.STORAGE_SET_DISK_INUSE:
                break;
        }
    },

    _saveTree: function() {
        DatabaseActionCreators.saveTree(this.refs.treeViewController.getTreeData(), 0);
    },

    _onCreateStack: function(name) {
        DatabaseActionCreators.createStack(name);
    },

    _onCreateNotebook: function(name) {
        DatabaseActionCreators.createNotebook(name);
    },

    _onRenameStack: function(name) {
        var node = this.refs.treeViewController.getSelectedNode();
        this.refs.treeViewController.nodeRename(node, name);
        this._saveTree();
    },

    _onRenameNotebook: function(name) {
        var node = this.refs.treeViewController.getSelectedNode();
        this.refs.treeViewController.nodeRename(node, name);
        this._saveTree();
    },

    _createStackInputDialog: function(createFolderHelper) {
        this.treeViewCreateFolderHelper = createFolderHelper;
        this.setState({
            inputDialogTitle: "Create a stack",
            inputDialogDefaultValue: "",
            inputDialogOnAffirmative: this._onCreateStack
        });
        this.refs.inputViewController.show();
    },

    _createNotebookInputDialog: function() {
        this.setState({
            inputDialogTitle: "Create a notebook",
            inputDialogDefaultValue: "",
            inputDialogOnAffirmative: this._onCreateNotebook
        });
        this.refs.inputViewController.show();
    },

    _renameInputDialog: function() {
        if (this.state.disableRenameButton)
            return;

        var node = this.refs.treeViewController.getSelectedNode();

        if (node.isFolder()) {
            this.setState({
                inputDialogTitle: "Rename a stack",
                inputDialogDefaultValue: node.name,
                inputDialogOnAffirmative: this._onRenameStack
            });
            this.refs.inputViewController.show();
        }
        else {
            this.setState({
                inputDialogTitle: "Rename a notebook",
                inputDialogDefaultValue: node.name,
                inputDialogOnAffirmative: this._onRenameNotebook
            });
            this.refs.inputViewController.show();
        }
    },

    _trashConfirmDialog: function() {
        if (this.state.disableTrashButton)
            return;

        var node = this.refs.treeViewController.getSelectedNode();

        if (node.isFolder()) {
            this.setState({
                alertTitle: 'Trash notebook stack',
                alertDescription: 'Are you sure to trash "' + node.name +
                                  '" ? (includes ' + node.children.length + ' notebooks)'
            });
        }
        else {
            this.setState({
                alertTitle: 'Trash notebook',
                alertDescription: 'Are you sure to trash "' + node.name + '" ?'
            });
        }

        this.refs.alertViewController.show();
    },

    _trashSelected: function() {
        var node = this.refs.treeViewController.getSelectedNode();

        if (node.isFolder()) {
            node.iterate(function(node) {
                DatabaseActionCreators.trashNotebook(node.id);
            });
            return true;
        }
        else {
            DatabaseActionCreators.trashNotebook(node.id);
        }
    },

    _onTreeSelect: function(node) {
        if (!node) return;

        if (node.id === 1)
            this.setState({ disableRenameButton: true, disableTrashButton: true });
        else
            this.setState({ disableRenameButton: false, disableTrashButton: false });

        DatabaseActionCreators.selectNotebook(node.id);
    }

});

module.exports = BookshelfContainer;
