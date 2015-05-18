var AlertViewController      = require("framework/cutie/AlertView/js/AlertViewController.jsx");
var DropdownViewController   = require("framework/cutie/DropdownView/js/DropdownViewController.jsx");
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

    mixins: [ DiligentAgentMixin, StorageAgentMixin ],

    getInitialState: function() {
        return {
            disks: [],
            treeData: [],
            inputDialogTitle: '',
            inputDialogDefaultValue: '',
            inputDialogOnAffirmative: null
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

    },

    componentWillUnmount: function() {
        StorageAgent.detach(this);
        DiligentAgent.detach(this);
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
    },

    render: function() {
        var diskMenuDropdownItems = this.state.disks.map(function(disk) {
            var itemIconClass = StorageAgent.isDiskInUse(disk) ? "check" : "";
            return {
                text: (disk.name || disk.drive) + " (" + disk.type + ")",
                value: disk.uuid,
                icon: itemIconClass
            };
        });

        var diskMenuSelectHandler = function(value, text) {
            var _disk = StorageAgent.getDiskByUUID(value);
            StorageAgent.setDiskInUse(_disk);
        };

        var moreOpDropdownItems = [
            { text: "Rename", value: "rename", icon: "write",         onSelect: this._showRenameInputDialog },
            { text: "Trash",  value: "trash",  icon: "trash outline", onSelect: this._showTrashConfirmDialog },
            { text: "Search", value: "search", icon: "search",        onSelect: this._showSearchNotebookModal }
        ];

        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <DropdownViewController ref = "diskSelectDropdownViewController"
                                 itemDataSource = {diskMenuDropdownItems}
                                      iconClass = "disk outline"
                                   useSelectBar = {true}
                                       onChange = {diskMenuSelectHandler} />

                    <div className="ui pointing link item" onClick={this._showCreateNotebookInputDialog}>
                        <i className="plus icon"></i>
                        New
                    </div>

                    <DropdownViewController ref = "moreOpDropdownViewController"
                                 itemDataSource = {moreOpDropdownItems}
                                      iconClass = "ellipsis vertical"
                                   useSelectBar = {false} />
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
        if (this.refs.moreOpDropdownViewController.state.disable)
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
        if (this.refs.moreOpDropdownViewController.state.disable)
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
            this.refs.moreOpDropdownViewController.setState({ disable: true });
        else
            this.refs.moreOpDropdownViewController.setState({ disable: false });

        DatabaseActionCreators.selectNotebook(node);
    }

});

module.exports = BookshelfContainer;
