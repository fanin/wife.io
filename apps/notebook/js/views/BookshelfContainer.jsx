import assign from 'object-assign';
import StorageAPI from 'lib/api/StorageAPI';
import Dialog from 'lib/cutie/Dialog';
import Form from 'lib/cutie/Form';
import Input from 'lib/cutie/Input';
import Dropdown from 'lib/cutie/Dropdown';
import JqTreeViewController from './JqTreeViewController.jsx';
import NotebookConstants from '../constants/NotebookConstants';
import NotebookActionConstants from '../constants/NotebookActionConstants';
import DatabaseStore from '../stores/DatabaseStore';
import DatabaseActionCreators from '../actions/DatabaseActionCreators';

var notebookInputRules = [
  {
    type: "empty",
    prompt: "Notebook name is empty"
  },
  /*
  {
    type   : "hasSpecialChar",
    prompt : "Only _ is allowed special character"
  }
  */
];

export default class BookshelfContainer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      disks: [],
      diskInUse: null,
      treeData: [],
      exclusiveTreeNodes: [ NotebookConstants.DATABASE_NOTEBOOK_ALL_ID ],
      notebookSearchString: "",
      loadingSearch: false,
      clearingSearch: false,
      inputDialogTitle: "",
      inputDialogDefaultValue: "",
      onInputDialogAffirmative: null,
      disableMenuItemNew: false,
      disableMenuItemRename: true,
      disableMenuItemTrash: true,
      disableMenuItemSearch: false
    };
    this._timerSaveTreeDelay = null;
  }

  componentWillMount() {
    DatabaseStore.addChangeListener(this.onDatabaseChange.bind(this));

    $.fn.form.settings.rules.hasSpecialChar = function(text) {
      var regExp = /[`~,.<>\-;':"/[\]|{}()=+!@#$%^&*]/;
      return !regExp.test(text);
    };

    StorageAPI.onDiskEvent((event) => {
      if (event.eventType === "INSERT") {
        StorageAPI.list({
          onSuccess: (disks) => { this.setState({ disks: disks }) }
        });
      }
      else if (event.eventType === "REMOVE") {
        StorageAPI.list({
          onSuccess: (disks) => {
            this.setState({ disks: disks });
            if (event.disk.uuid === this.state.diskInUse.uuid) {
              DatabaseActionCreators.openDatabase(disks[0]);
            }
          }
        });
      }
    });
  }

  componentDidMount() {
    StorageAPI.list({
      onSuccess: (disks) => {
        this.setState({ disks: disks });
        DatabaseActionCreators.openDatabase(disks[0]);
      },

      onError: (error) => {
        this.showErrorAlert("Storage Error", error.message);
        DatabaseActionCreators.closeDatabase();
      }
    });
  }

  componentWillUnmount() {
    DatabaseStore.removeChangeListener(this.onDatabaseChange);
  }

  render() {
    var diskMenuItems = this.state.disks.map((disk) => {
      var itemIconClass = (
            this.state.diskInUse && this.state.diskInUse.uuid === disk.uuid
          ) ? "check icon" : "icon";

      return (
        <div
          className="item"
          key={disk.uuid}
          data-value={disk.uuid}
        >
          <i className={itemIconClass} />
          { (disk.name || disk.drive) + " (" + disk.type + ")" }
        </div>
      );
    });

    var inputForm = (
      <Form
        ref="inputForm"
        preventDefaultSubmit={true}
        fields={{
          name: {
            identifier: 'name',
            rules: notebookInputRules
          }
        }}
        dataType="Array"
        onValidate={(hasError, formData) => {
          if (!hasError) {
            this.state.onInputDialogAffirmative(formData);
            this.refs.editInputViewController.hide();
            this.refs.inputForm.clear();
          }
        }}
      >
        <div className="field">
          <label>Name</label>
          <Input
            type="text"
            name="name"
            defaultValue={this.state.inputDialogDefaultValue}
          />
        </div>
        <div className="ui error message" />
      </Form>
    );

    var searchForm = (
      <Form
        ref="searchForm"
        preventDefaultSubmit={true}
        fields={{
          name: {
            identifier: 'name',
            rules: notebookInputRules
          }
        }}
        dataType="Array"
        onValidate={(hasError, formData) => {
          if (!hasError) {
            this.onSearchNotebook(formData);
            this.refs.searchInputViewController.hide();
          }
        }}
      >
        <div className="field">
          <Input type="text" name="name" />
        </div>
        <div className="ui error message" />
      </Form>
    );

    return (
      <div className="nb-column-container">
        <div className="ui menu nb-column-toolbar">
          <Dropdown
            classes="compact link item"
            buttonIconClass="disk outline"
            itemSelectBar={true}
            transition="drop"
            onChange={(value, text) => {
              this.onDiskMenuSelect(value, text);
            }}
          >
            {diskMenuItems}
          </Dropdown>

          <div
            className={this.state.disableMenuItemNew
                        ? "ui pointing link item disabled"
                        : "ui pointing link item"}
            onClick={this.showCreateNotebookInputDialog.bind(this)}
          >
            <i className="plus icon"></i>
            New
          </div>

          <Dropdown
            classes="compact link item"
            buttonIconClass="ellipsis vertical"
            itemSelectBar={false}
            transition="drop"
            onChange={(value, text) => {
              switch (value) {
              case 'rename':
                if (!this.state.disableMenuItemRename)
                  this.showRenameInputDialog();
                break;
              case 'trash':
                if (!this.state.disableMenuItemTrash)
                  this.showTrashConfirmDialog();
                break;
              case 'search':
                if (!this.state.disableMenuItemSearch) {
                  if (this.state.notebookSearchString)
                    this.clearSearch();
                  else
                    this.showSearchInputDialog();
                }
                break;
              }
            }}
          >
            <div
              className={ this.state.disableMenuItemRename ? "disabled item" : "item" }
              key="rename"
              data-value="rename"
            >
              <i className="write icon" />
              Rename
            </div>
            <div
              className={ this.state.disableMenuItemTrash ? "disabled item" : "item" }
              key="trash"
              data-value="trash"
            >
              <i className="trash outline icon" />
              Trash
            </div>
            <div
              className={ this.state.disableMenuItemSearch ? "disabled item" : "item" }
              key="search"
              data-value="search"
            >
              <i className="search icon" />
              { this.state.notebookSearchString ? "Clear search" : "Search" }
            </div>
          </Dropdown>
        </div>

        <div className="nb-column-content">
          <JqTreeViewController
            ref="treeViewController"
            data={this.state.treeData}
            exclusives={this.state.exclusiveTreeNodes}
            onCreateNode={this.onTreeCreateNode.bind(this)}
            onCreateFolder={this.showCreateStackInputDialog.bind(this)}
            onOpen={this.saveTree.bind(this)}
            onClose={this.saveTree.bind(this)}
            onMove={this.saveTree.bind(this)}
            onSelect={this.onTreeSelect.bind(this)}
            onRefresh={this.onTreeRefresh.bind(this)}
          />
        </div>

        <Dialog
          ref="editInputViewController"
          title={ this.state.inputDialogTitle }
          customView={ inputForm }
          actionButtons={
            [{
              title: "Cancel",
              iconType: "remove",
              color: "red",
              actionType: "deny"
            },
            {
              title: "OK",
              iconType: "checkmark",
              color: "green",
              actionType: "approve"
            }]
          }
          onApprove={() => {
            this.refs.inputForm.submit();
            return false;
          }}
          onDeny={() => {
            this.refs.inputForm.clear();
          }}
          onShow={() => {
            this.refs.inputForm.focus();
          }}
        />

        <Dialog
          ref="searchInputViewController"
          title="Search notebook"
          customView={ searchForm }
          actionButtons={
            [{
              title: "Cancel",
              iconType: "remove",
              color: "red",
              actionType: "deny"
            },
            {
              title: "OK",
              iconType: "checkmark",
              color: "green",
              actionType: "approve"
            }]
          }
          onApprove={() => {
            this.refs.searchForm.submit();
            return false;
          }}
          onDeny={() => {
            this.refs.searchForm.clear();
          }}
          onShow={() => {
            this.refs.searchForm.focus();
          }}
        />

        <Dialog
          ref="confirmDialog"
          title={this.state.confirmTitle}
          message={this.state.confirmMessage}
          actionButtons={
            [{
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
            }]
          }
          onApprove={this.trashSelected.bind(this)}
        />

        <Dialog
          ref="alertDialog"
          title={this.state.errorTitle}
          message={this.state.errorMessage}
          actionButtons={
            [{
              title: "Got It",
              color: "red",
              actionType: "approve",
            }]
          }
          actionButtonsAlign="center"
        />
      </div>
    );
  }

  onDiskMenuSelect(value, text) {
    StorageAPI.getDisk(value, {
      onSuccess: (disk) => {
        DatabaseActionCreators.closeDatabase();
        DatabaseActionCreators.openDatabase(disk);
      },

      onError: (error) => {
        this.showErrorAlert(
          "Storage Error", "Select disk '" + text + "' error:\n" + error.message
        );
      }
    });
  }

  onDatabaseChange(change) {
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
        this.saveTree();
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_SUCCESS:
        this.refs.treeViewController.nodeCreate(
          change.notebook.notebookId,
          change.notebook.notebookName
        );
        this.saveTree();
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_SUCCESS:
        var superNode = this.refs.treeViewController.getNodeById(
          NotebookConstants.DATABASE_NOTEBOOK_ALL_ID
        );
        this.refs.treeViewController.nodeRemove(change.notebookNode);
        this.refs.treeViewController.nodeSelect(superNode);
        this.saveTree();
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
            NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID
          );
          this.refs.treeViewController.nodeSelect(_searchNode);
        }
        else {
          _searchNode = this.refs.treeViewController.getNodeById(
            NotebookConstants.DATABASE_NOTEBOOK_SEARCH_ID
          );
          if (_searchNode) {
            this.refs.treeViewController.nodeRemove(_searchNode);
            this.refs.treeViewController.nodeSelect(
              DatabaseStore.getSelectedNotebookNode()
            );
          }
        }
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
        this.showErrorAlert(
          "Notebook Database Error",
          "Error Code: " + change.actionType + "\n\n" + DatabaseStore.getError()
        );
        break;
    }
  }

  onTreeCreateNode(node) {
    //
  }

  saveTree(node, immediately) {
    if (this.state.notebookSearchString)
      return;

    if (this._timerSaveTreeDelay)
      clearTimeout(this._timerSaveTreeDelay);

    this._timerSaveTreeDelay = setTimeout(() => {
      DatabaseActionCreators.saveTree(
        this.refs.treeViewController.getTreeData(), 0
      );
      this._timerSaveTreeDelay = null;
    }, immediately ? 0 : 1000);
  }

  onCreateStack(formData) {
    DatabaseActionCreators.createStack(formData[0].value);
  }

  onCreateNotebook(formData) {
    DatabaseActionCreators.createNotebook(formData[0].value);
  }

  onRenameStack(formData) {
    var node = this.refs.treeViewController.getSelectedNode();
    this.refs.treeViewController.nodeRename(node, formData[0].value);
    this.saveTree();
  }

  onRenameNotebook(formData) {
    var node = this.refs.treeViewController.getSelectedNode();
    this.refs.treeViewController.nodeRename(node, formData[0].value);
    this.saveTree();
  }

  onSearchNotebook(formData) {
    var name = formData[0].value;

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
        for (let i = 0, len = obj.length; i < len; i++) {
          copy[i] = clone(obj[i]);
        }
        return copy;
      }

      // Handle Object
      if (obj instanceof Object) {
        copy = {};
        for (let attr in obj) {
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
            || _searchTreeData[_i].name.toLowerCase()
                                  .indexOf(name.toLowerCase()) >= 0)
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
  }

  showCreateStackInputDialog(createFolderHelper) {
    this.treeViewCreateFolderHelper = createFolderHelper;
    this.setState({
      inputDialogTitle: "Create a stack",
      inputDialogDefaultValue: "",
      onInputDialogAffirmative: this.onCreateStack.bind(this)
    });

    this.refs.editInputViewController.show();
  }

  showCreateNotebookInputDialog() {
    if (this.state.disableMenuItemNew) return;

    this.setState({
      inputDialogTitle: "Create a notebook",
      inputDialogDefaultValue: "",
      onInputDialogAffirmative: this.onCreateNotebook.bind(this)
    });

    this.refs.editInputViewController.show();
  }

  showRenameInputDialog() {
    var node = this.refs.treeViewController.getSelectedNode();

    if (node.isFolder()) {
      this.setState({
        inputDialogTitle: "Rename a stack",
        inputDialogDefaultValue: node.name,
        onInputDialogAffirmative: this.onRenameStack.bind(this)
      });

      this.refs.editInputViewController.show();
    }
    else {
      this.setState({
        inputDialogTitle: "Rename a notebook",
        inputDialogDefaultValue: node.name,
        onInputDialogAffirmative: this.onRenameNotebook.bind(this)
      });

      this.refs.editInputViewController.show();
    }
  }

  showTrashConfirmDialog() {
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

    this.refs.confirmDialog.show();
  }

  showSearchInputDialog() {
    this.refs.searchInputViewController.show();
  }

  clearSearch() {
    this.setState({
      clearingSearch: true,
      notebookSearchString: "",
      treeData: DatabaseStore.getTreeData()
    });
  }

  showErrorAlert(errorTitle, errorMessage) {
    this.setState({
      errorTitle: errorTitle,
      errorMessage: errorMessage
    });

    this.refs.alertDialog.show();
  }

  trashSelected() {
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
  }

  onTreeSelect(node) {
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
  }

  onTreeRefresh() {
    if (this.state.loadingSearch) {
      var searchTree = this.refs.treeViewController.getTree();
      if (searchTree.children.length > 0) {
        var node = this.refs.treeViewController.getNodeById(
          searchTree.children[0].id
        );
        this.refs.treeViewController.nodeSelect(node);
      }
      this.setState({ loadingSearch: false });
    }
    else if (this.state.clearingSearch) {
      var node = this.refs.treeViewController.getNodeById(
        DatabaseStore.getSelectedNotebookNode().id
      );
      this.refs.treeViewController.nodeSelect(node);
      this.setState({ clearingSearch: false });
    }
  }

}
