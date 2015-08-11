var assign                   = require("object-assign");
var StorageAPI               = require('diligent/Storage/StorageAPI');
var AlertViewController      = require("framework/cutie/AlertView/js/AlertViewController.jsx");
var DropdownViewController   = require("framework/cutie/DropdownView/js/DropdownViewController.jsx");
var JqTreeViewController     = require("./JqTreeViewController.jsx");
var InputModalViewController = require("./InputModalViewController.jsx");
var NotebookConstants        = require("../constants/NotebookConstants");
var NotebookActionConstants  = require("../constants/NotebookActionConstants");
var DatabaseStore            = require("../stores/DatabaseStore");
var DatabaseActionCreators   = require("../actions/DatabaseActionCreators");

var notebookInputRules = [
    {
        type   : "empty",
        prompt : "Notebook name is empty"
    },
    /*
    {
        type   : "hasSpecialChar",
        prompt : "Only _ is allowed special character"
    }
    */
];

var BookshelfContainer = React.createClass({
    _timerSaveTreeDelay: null,

    getInitialState() {
        return {
            disks: [],
            diskInUse: null,
            treeData: [],
            exclusiveTreeNodes: [ NotebookConstants.DATABASE_NOTEBOOK_ALL_ID ],
            notebookSearchString: "",
            loadingSearch: false,
            clearingSearch: false,
            inputDialogTitle: "",
            inputDialogDefaultValue: "",
            inputDialogOnAffirmative: null,
            disableMenuItemNew: false,
            disableMenuItemRename: true,
            disableMenuItemTrash: true,
            disableMenuItemSearch: false
        };
    },

    componentWillMount() {
        DatabaseStore.addChangeListener(this._onDatabaseChange);

        $.fn.form.settings.rules.hasSpecialChar = function(text) {
            var regExp = /[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/;
            return !regExp.test(text);
        };

        StorageAPI.onDiskEvent(function(event) {
            if (event.eventType === "INSERT") {
                StorageAPI.list({
                    onSuccess: function(disks) {
                        this.setState({ disks: disks });
                    }.bind(this)
                });
            }
            else if (event.eventType === "REMOVE") {
                StorageAPI.list({
                    onSuccess: function(disks) {
                        this.setState({ disks: disks });
                        if (event.disk.uuid === this.state.diskInUse.uuid) {
                            DatabaseActionCreators.openDatabase(disks[0]);
                        }
                    }.bind(this)
                });
            }
        }.bind(this));
    },

    componentDidMount() {
        StorageAPI.list({
            onSuccess: function(disks) {
                this.setState({ disks: disks });
                DatabaseActionCreators.openDatabase(disks[0]);
            }.bind(this),

            onError: function(error) {
                this._showErrorAlert("Storage Error", "Error: " + args.error);
                DatabaseActionCreators.closeDatabase();
            }.bind(this)
        });
    },

    componentWillUnmount() {
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
    },

    render() {
        var diskMenuDropdownItems = this.state.disks.map(function(disk) {
            var itemIconClass = (this.state.diskInUse && this.state.diskInUse.uuid === disk.uuid) ? "check" : "";
            return {
                text: (disk.name || disk.drive) + " (" + disk.type + ")",
                value: disk.uuid,
                icon: itemIconClass
            };
        }.bind(this));

        var moreOpDropdownItems = [
            {
                text:  "Rename",
                value: "rename",
                icon:  "write",
                disabled: this.state.disableMenuItemRename,
                onSelect: this._showRenameInputDialog
            },
            {
                text:  "Trash",
                value: "trash",
                icon:  "trash outline",
                disabled: this.state.disableMenuItemTrash,
                onSelect: this._showTrashConfirmDialog
            },
            {
                text:  this.state.notebookSearchString ? "Clear search" : "Search",
                value: "search",
                icon:  "search",
                disabled: this.state.disableMenuItemSearch,
                onSelect: this.state.notebookSearchString ? this._clearSearch : this._showSearchInputDialog
            }
        ];

        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <DropdownViewController ref = "diskSelectDropdownViewController"
                                 itemDataSource = {diskMenuDropdownItems}
                                      iconClass = "disk outline"
                                   useSelectBar = {true}
                                       onChange = {this._onDiskMenuSelect} />

                    <div className = {this.state.disableMenuItemNew ? "ui pointing link item disabled"
                                                                    : "ui pointing link item"}
                           onClick = {this._showCreateNotebookInputDialog}>
                        <i className = "plus icon"></i>
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
                                   exclusives = {this.state.exclusiveTreeNodes}
                                 onCreateNode = {this._onTreeCreateNode}
                               onCreateFolder = {this._showCreateStackInputDialog}
                                       onOpen = {this._saveTree}
                                      onClose = {this._saveTree}
                                       onMove = {this._saveTree}
                                     onSelect = {this._onTreeSelect}
                                    onRefresh = {this._onTreeRefresh} />
                </div>

                <InputModalViewController ref = "editInputViewController"
                                   identifier = "edit-input-view"
                                        title = {this.state.inputDialogTitle}
                                 defaultValue = {this.state.inputDialogDefaultValue}
                                        rules = {notebookInputRules}
                          onActionAffirmative = {this.state.inputDialogOnAffirmative} />

                <InputModalViewController ref = "searchInputViewController"
                                   identifier = "search-input-view"
                                        title = "Search notebook"
                                 defaultValue = ""
                                        rules = {notebookInputRules}
                          onActionAffirmative = {this._onSearchNotebook} />

                <AlertViewController ref = "confirmAlerter"
                                   title = {this.state.confirmTitle}
                                 message = {this.state.confirmMessage}
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
                               onApprove = {this._trashSelected} />

                <AlertViewController ref = "errorAlerter"
                                   title = {this.state.errorTitle}
                                 message = {this.state.errorMessage}
                           actionButtons = {[{
                                                title: "Got It",
                                                color: "red",
                                                actionType: "approve",
                                            }]}
                      actionButtonsAlign = "center" />
            </div>
        );
    },

    _onDiskMenuSelect(value, text) {
        var _disk = StorageAPI.getDisk(value, {
            onSuccess: function(disk) {
                DatabaseActionCreators.closeDatabase();
                DatabaseActionCreators.openDatabase(disk);
            }.bind(this),

            onError: function(error) {
                this._showErrorAlert("Storage Error", "Select disk '" + text + "' error:\n" + error.message);
            }.bind(this)
        });
    },

    _onDatabaseChange(change) {
        var _searchNode;
        var _searchString;
        switch (change.actionType) {
            case NotebookActionConstants.NOTEBOOK_DATABASE_OPEN:
                this.setState({ diskInUse: DatabaseStore.getStorage() });
                /* Load tree in NoteEditorContainer */
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_SUCCESS:
                this.setState({
                    clearingSearch: false,
                    notebookSearchString: "",
                    treeData: DatabaseStore.getTreeData()
                });

                this.refs.treeViewController.nodeSelect(
                    this.refs.treeViewController.getNodeById(
                        NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
                    )
                );
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_SUCCESS:
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_STACK:
                this.treeViewCreateFolderHelper(change.stack.id, change.stack.name);
                this.treeViewCreateFolderHelper = undefined;
                this._saveTree();
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS:
                this.refs.treeViewController.nodeCreate(change.notebook.notebookId, change.notebook.notebookName);
                this._saveTree();
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS:
                var superNode = this.refs.treeViewController.getNodeById(
                    NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
                );
                this.refs.treeViewController.nodeRemove(change.notebookNode);
                this.refs.treeViewController.nodeSelect(superNode);
                this._saveTree();
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES:
                _searchString = DatabaseStore.getSearchString();
                if (_searchString) {
                    this.refs.treeViewController.nodeCreate(
                        NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID,
                        "Search notes for `" + _searchString + "`",
                        "before",
                        DatabaseStore.getSuperNotebookNode()
                    );
                    _searchNode = this.refs.treeViewController.getNodeById(
                                        NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID);
                    this.refs.treeViewController.nodeSelect(_searchNode);
                }
                else {
                    _searchNode = this.refs.treeViewController.getNodeById(
                                        NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID);
                    if (_searchNode) {
                        this.refs.treeViewController.nodeRemove(_searchNode);
                        this.refs.treeViewController.nodeSelect(DatabaseStore.getSelectedNotebookNode());
                    }
                }
                break;

            case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
            case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
            case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
            case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
                this._showErrorAlert(
                    "Notebook Database Error",
                    "Error Code: " + change.actionType + "\n\n" + DatabaseStore.getError()
                );
                break;
        }
    },

    _onTreeCreateNode(node) {
        //
    },

    _saveTree(node, immediately) {
        if (this.state.notebookSearchString)
            return;

        if (this._timerSaveTreeDelay)
            clearTimeout(this._timerSaveTreeDelay);

        this._timerSaveTreeDelay = setTimeout(function() {
            DatabaseActionCreators.saveTree(this.refs.treeViewController.getTreeData(), 0);
            this._timerSaveTreeDelay = null;
        }.bind(this), immediately ? 0 : 1000);
    },

    _onCreateStack(name) {
        DatabaseActionCreators.createStack(name);
    },

    _onCreateNotebook(name) {
        DatabaseActionCreators.createNotebook(name);
    },

    _onRenameStack(name) {
        var node = this.refs.treeViewController.getSelectedNode();
        this.refs.treeViewController.nodeRename(node, name);
        this._saveTree();
    },

    _onRenameNotebook(name) {
        var node = this.refs.treeViewController.getSelectedNode();
        this.refs.treeViewController.nodeRename(node, name);
        this._saveTree();
    },

    _onSearchNotebook(name) {
        function clone(obj) {
            var copy;

            // Handle the 3 simple types, and null or undefined
            if (null == obj || "object" != typeof obj) return obj;

            // Handle Date
            if (obj instanceof Date) {
                copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }

            // Handle Array
            if (obj instanceof Array) {
                copy = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = clone(obj[i]);
                }
                return copy;
            }

            // Handle Object
            if (obj instanceof Object) {
                copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
                }
                return copy;
            }

            throw new Error("Unable to copy obj! Its type isn't supported.");
        }

        var _searchTreeData = clone(DatabaseStore.getTreeData());
        var _i = 0;

        while (_i < _searchTreeData.length) {
            if (_searchTreeData[_i].name) {
                if (_searchTreeData[_i].id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
                    || _searchTreeData[_i].name.toLowerCase().indexOf(name.toLowerCase()) >= 0)
                    _i++;
                else if (_searchTreeData[_i].children) {
                    var _children = _searchTreeData[_i].children;
                    var _j = 0;
                    while (_j < _children.length) {
                        if (_children[_j].name.toLowerCase().indexOf(name.toLowerCase()) >= 0)
                            _j++;
                        else
                            _children.splice(_j, 1);
                    }

                    if (_children.length === 0)
                        _searchTreeData.splice(_i, 1);
                    else
                        _i++;
                }
                else
                    _searchTreeData.splice(_i, 1);
            }
            else
                _i++;
        }

        this.setState({
            loadingSearch: true,
            notebookSearchString: name,
            treeData: _searchTreeData
        });
    },

    _showCreateStackInputDialog(createFolderHelper) {
        this.treeViewCreateFolderHelper = createFolderHelper;
        this.setState({
            inputDialogTitle: "Create a stack",
            inputDialogDefaultValue: "",
            inputDialogOnAffirmative: this._onCreateStack
        });

        this.refs.editInputViewController.show();
    },

    _showCreateNotebookInputDialog() {
        if (this.state.disableMenuItemNew) return;

        this.setState({
            inputDialogTitle: "Create a notebook",
            inputDialogDefaultValue: "",
            inputDialogOnAffirmative: this._onCreateNotebook
        });

        this.refs.editInputViewController.show();
    },

    _showRenameInputDialog() {
        var node = this.refs.treeViewController.getSelectedNode();

        if (node.isFolder()) {
            this.setState({
                inputDialogTitle: "Rename a stack",
                inputDialogDefaultValue: node.name,
                inputDialogOnAffirmative: this._onRenameStack
            });

            this.refs.editInputViewController.show();
        }
        else {
            this.setState({
                inputDialogTitle: "Rename a notebook",
                inputDialogDefaultValue: node.name,
                inputDialogOnAffirmative: this._onRenameNotebook
            });

            this.refs.editInputViewController.show();
        }
    },

    _showTrashConfirmDialog() {
        var node = this.refs.treeViewController.getSelectedNode();

        if (node.isFolder()) {
            this.setState({
                confirmTitle: 'Trash notebook stack',
                confirmMessage: 'Are you sure to trash "' + node.name +
                                '" ? (includes ' + node.children.length + ' notebooks)'
            });
        }
        else {
            this.setState({
                confirmTitle: 'Trash notebook',
                confirmMessage: 'Are you sure to trash "' + node.name + '" ?'
            });
        }

        this.refs.confirmAlerter.show();
    },

    _showSearchInputDialog() {
        this.refs.searchInputViewController.show();
    },

    _clearSearch() {
        this.setState({
            clearingSearch: true,
            notebookSearchString: "",
            treeData: DatabaseStore.getTreeData()
        });
    },

    _showErrorAlert(errorTitle, errorMessage) {
        this.setState({
            errorTitle: errorTitle,
            errorMessage: errorMessage
        });

        this.refs.errorAlerter.show();
    },

    _trashSelected() {
        var node = this.refs.treeViewController.getSelectedNode();

        if (node.isFolder()) {
            node.iterate(function(node) {
                DatabaseActionCreators.trashNotebook(node);
            });
            return true;
        }
        else {
            DatabaseActionCreators.trashNotebook(node);
        }
    },

    _onTreeSelect(node) {
        if (!node) return;

        if (node.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID) {
            if (this.state.notebookSearchString)
                this.setState({
                    disableMenuItemNew: true,
                    disableMenuItemRename: true,
                    disableMenuItemTrash: true
                });
            else
                this.setState({
                    disableMenuItemNew: false,
                    disableMenuItemRename: true,
                    disableMenuItemTrash: true
                });
        }
        else if (node.id === NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID) {
            return this.setState({
                disableMenuItemNew: true,
                disableMenuItemRename: true,
                disableMenuItemTrash: true
            });
        }
        else {
            if (this.state.notebookSearchString)
                this.setState({
                    disableMenuItemNew: true,
                    disableMenuItemRename: false,
                    disableMenuItemTrash: false
                });
            else
                this.setState({
                    disableMenuItemNew: false,
                    disableMenuItemRename: false,
                    disableMenuItemTrash: false
                });
        }

        if (this.state.notebookSearchString)
            node.isSearching = true;
        else
            delete node.isSearching;

        setTimeout(function() {
            DatabaseActionCreators.selectNotebook(node);
        }, 1);
    },

    _onTreeRefresh() {
        if (this.state.loadingSearch) {
            var searchTree = this.refs.treeViewController.getTree();
            if (searchTree.children.length > 0) {
                var node = this.refs.treeViewController.getNodeById(searchTree.children[0].id);
                this.refs.treeViewController.nodeSelect(node);
            }
            this.setState({ loadingSearch: false });
        }
        else if (this.state.clearingSearch) {
            var node = this.refs.treeViewController.getNodeById(DatabaseStore.getSelectedNotebookNode().id);
            this.refs.treeViewController.nodeSelect(node);
            this.setState({ clearingSearch: false });
        }
    }

});

module.exports = BookshelfContainer;
