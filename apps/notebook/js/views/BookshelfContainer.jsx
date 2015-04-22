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
        DatabaseActionCreators.loadTree();
    },

    diligentClientWillTerminate: function() {

    },

    diligentClientDidTerminate: function() {

    },

    diligentConnectionDidFail: function() {

    }
};

var StorageAgentMixin = {
    storageDidReceiveList: function(disks) {
        this.setState({ disks: disks });
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
        DatabaseActionCreators.loadTree();
    },

    storageHasError: function(error) {

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
            disableRenameButton: false,
            disableTrashButton: false
        };
    },

    componentWillMount: function() {
        DiligentAgent.attach(this);
        StorageAgent.attach(this);

        DatabaseStore.addChangeListener(this._onDatabaseChange);

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
                var _disk = StorageAgent.getDiskByUUID(value);
                StorageAgent.setDiskInUse(_disk);
            }
        });
    },

    componentWillUnmount: function() {
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
        StorageAgent.detach(this);
        DiligentAgent.detach(this);
    },

    render: function() {
        var diskMenuItems = this.state.disks.map(function(disk) {
            var iconClass = StorageAgent.isDiskInUse(disk) ? "check icon" : "icon";
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

    _onDatabaseChange: function(change) {
        switch (change) {
            case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_SUCCESS:
                this.setState({ treeData: DatabaseStore.getTreeData() });
                // FIXME: use timeout function to avoid dispatcher error
                setTimeout(function() {
                    this.refs.treeViewController.nodeSelect(this.refs.treeViewController.getNodeById(1));
                }.bind(this), 1);
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
                //TODO: select default notebook
                break;
            case NotebookConstants.NOTEBOOK_APP_DATABASE_LOADTREE_ERROR:
            case NotebookConstants.NOTEBOOK_APP_DATABASE_SAVETREE_ERROR:
            case NotebookConstants.NOTEBOOK_APP_DATABASE_CREATE_NOTEBOOK_ERROR:
            case NotebookConstants.NOTEBOOK_APP_DATABASE_TRASH_NOTEBOOK_ERROR:
                // TODO: show error
                console.log(change + ": " + DatabaseStore.getError());
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
