var AlertViewController      = require("framework/cutie/AlertView/js/AlertViewController.jsx");
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

var DiligentAgentMixin = {
    diligentClientWillLaunch: function() {

    },

    diligentClientDidLaunch: function() {
        StorageAgent.list();
    },

    diligentClientWillTerminate: function() {

    },

    diligentClientDidTerminate: function() {

    },

    diligentConnectionDidFail: function() {

    }
};

var StorageAgentMixin = {
    storageListDidReceive: function(disks) {
        this.setState({ disks: disks });
        DatabaseActionCreators.openDatabase(StorageAgent.getDiskInUse());
        DatabaseActionCreators.loadTree();
    },

    storageDidMount: function(disk) {
        this.setState({ disks: StorageAgent.getDisks() });
    },

    storageDidUnmount: function(disk) {
        this.setState({ disks: StorageAgent.getDisks() });
    },

    storageWillSetInUse: function(disk) {

    },

    storageDidSetInUse: function(disk) {

    },

    storageSetInUseFail: function(args) {
        // TODO: prompt args.disk & args.error
    },

    storageInUseDidChange: function(disk) {
        this.setState({ disks: StorageAgent.getDisks() });
        DatabaseActionCreators.closeDatabase();
        DatabaseActionCreators.openDatabase(disk);
        DatabaseActionCreators.loadTree();
    },

    storageHasError: function(error) {
        DatabaseActionCreators.closeDatabase();
    }
};

var BookshelfContainer = React.createClass({

    mixins: [
        DiligentAgentMixin,
        StorageAgentMixin
    ],

    getInitialState: function() {
        return {
            disks: [],
            treeData: [],
            inputDialogTitle: '',
            inputDialogDefaultValue: '',
            inputDialogOnAffirmative: null,
            disableMoreOperationButton: false
        };
    },

    componentWillMount: function() {
        DatabaseStore.addChangeListener(this._onDatabaseChange);

        $.fn.form.settings.rules.hasSpecialChar = function(text) {
            var regExp = /[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/;
            return !regExp.test(text);
        };

        DiligentAgent.attach(this);
        StorageAgent.attach(this);
    },

    componentDidMount: function() {
        $(".nb-toolbar-disksel-dropdown").dropdown({
            transition: "drop",
            onChange: function(value, text, $selectedItem) {
                var _disk = StorageAgent.getDiskByUUID(value);
                StorageAgent.setDiskInUse(_disk);
            }
        });

        $(".nb-toolbar-moreop-dropdown").dropdown({
            transition: "drop",
            action: "nothing"
        });
    },

    componentWillUnmount: function() {
        StorageAgent.detach(this);
        DiligentAgent.detach(this);
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
    },

    render: function() {
        var diskMenuItems = this.state.disks.map(function(disk) {
            var iconClass = StorageAgent.isDiskInUse(disk) ? "check icon" : "icon";
            return (
                <div className="item" data-value={disk.uuid} data-text={(disk.name || disk.drive)}>
                    <i className={iconClass}></i>
                    {(disk.name || disk.drive) + " (" + disk.type + ")"}
                </div>
            );
        });

        var moreOpButtonClass = this.state.disableMoreOperationButton ?
                                "ui disabled pointing dropdown link item nb-toolbar-moreop-dropdown" :
                                "ui pointing dropdown link item nb-toolbar-moreop-dropdown";

        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <div className="ui pointing dropdown item nb-toolbar-disksel-dropdown">
                        <i className="disk outline icon"></i>
                        <div className="menu">
                            {diskMenuItems}
                        </div>
                    </div>
                    <div className="ui pointing link item" onClick={this._showCreateNotebookInputDialog}>
                        <i className="plus icon"></i>
                        New
                    </div>
                    <div className={moreOpButtonClass}>
                        <i className="ellipsis vertical icon"></i>
                        <div className="menu">
                            <div className="item" data-value="rename" data-text="Rename" onClick={this._showRenameInputDialog}>
                                <i className="write icon"></i>
                                Rename
                            </div>
                            <div className="item" data-value="trash" data-text="Trash" onClick={this._showTrashConfirmDialog}>
                                <i className="trash outline icon"></i>
                                Trash
                            </div>
                            <div className="item" data-value="search" data-text="Search" onClick={this._showSearchNotebookModal}>
                                <i className="search icon"></i>
                                Search
                            </div>
                        </div>
                    </div>
                </div>

                <div className="nb-column-content">
                    <JqTreeViewController ref = "treeViewController"
                                         data = {this.state.treeData}
                                   exclusives = {[ 1 ]}
                                 onCreateNode = {this._onTreeCreateNode}
                               onCreateFolder = {this._showCreateStackInputDialog}
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

                <AlertViewController ref = 'alertViewController'
                                   title = {this.state.alertTitle}
                             description = {this.state.alertDescription}
                     onActionAffirmative = {this._trashSelected} />
            </div>
        );
    },

    _onDatabaseChange: function(change) {
        switch (change.actionType) {
            case NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS:
                this.setState({ treeData: DatabaseStore.getTreeData() });
                setTimeout(function() {
                    this.refs.treeViewController.nodeSelect(this.refs.treeViewController.getNodeById(1));
                }.bind(this), 1);
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS:
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_CREATE_STACK:
                this.treeViewCreateFolderHelper(change.stack.stackId, change.stack.stackName);
                this.treeViewCreateFolderHelper = undefined;
                this._saveTree();
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS:
                this.refs.treeViewController.nodeCreate(change.notebook.notebookId, change.notebook.notebookName);
                this._saveTree();
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS:
                this.refs.treeViewController.nodeRemove(change.notebookNode);
                this._saveTree();
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
            case NotebookConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
                // TODO: show error
                console.log(change + ": " + DatabaseStore.getError());
                break;
        }
    },

    _onTreeCreateNode: function(node) {
        node.disk = StorageAgent.getDiskInUse();
    },

    _saveTree: function() {
        // TODO: add delay timer to reduce server loading with high freq requests
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

    _showCreateStackInputDialog: function(createFolderHelper) {
        this.treeViewCreateFolderHelper = createFolderHelper;
        this.setState({
            inputDialogTitle: "Create a stack",
            inputDialogDefaultValue: "",
            inputDialogOnAffirmative: this._onCreateStack
        });
        this.refs.inputViewController.show();
    },

    _showCreateNotebookInputDialog: function() {
        this.setState({
            inputDialogTitle: "Create a notebook",
            inputDialogDefaultValue: "",
            inputDialogOnAffirmative: this._onCreateNotebook
        });
        this.refs.inputViewController.show();
    },

    _showRenameInputDialog: function() {
        if (this.state.disableMoreOperationButton)
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

    _showTrashConfirmDialog: function() {
        if (this.state.disableMoreOperationButton)
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
        var superNode = this.refs.treeViewController.getNodeById(1);

        if (node.isFolder()) {
            node.iterate(function(node) {
                DatabaseActionCreators.trashNotebook(node);
            });
            return true;
        }
        else {
            DatabaseActionCreators.trashNotebook(node);
        }

        this.refs.treeViewController.nodeSelect(superNode);
    },

    _onTreeSelect: function(node) {
        if (!node) return;

        if (node.id === 1)
            this.setState({ disableMoreOperationButton: true });
        else
            this.setState({ disableMoreOperationButton: false });

        DatabaseActionCreators.selectNotebook(node);
    }

});

module.exports = BookshelfContainer;
