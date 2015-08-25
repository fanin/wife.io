var DatabaseActionCreators  = require("../actions/DatabaseActionCreators");
var NotebookConstants       = require("../constants/NotebookConstants");
var NotebookActionConstants = require("../constants/NotebookActionConstants");
var DatabaseStore           = require("../stores/DatabaseStore");
var ListViewController      = require("lib/cutie/ListView");
var DialogController        = require("lib/cutie/Dialog");
var DropdownMenu            = require("lib/cutie/DropdownMenu");

var SortMethods = {
  /* Sort by last modified date */
  sortByLastModifiedDate: function(a, b) {
    if (a.noteStat.mtime > b.noteStat.mtime) return -1;
    if (a.noteStat.mtime < b.noteStat.mtime) return 1;
    return 0;
  },
  /* Sort by creation date (newest first) */
  sortByCreationDateNewestFirst: function(a, b) {
    return (b.id - a.id);
  },
  /* Sort by creation date (oldest first) */
  sortByCreationDateOldestFirst: function(a, b) {
    return (a.id - b.id);
  },
  /* Sort by title (ascending) */
  sortByTitleAscending: function(a, b) {
    if (a.noteTitle < b.noteTitle) return -1;
    if (a.noteTitle > b.noteTitle) return 1;
    return 0;
  },
  /* Sort by title (descending) */
  sortByTitleDescending: function(a, b) {
    if (a.noteTitle > b.noteTitle) return -1;
    if (a.noteTitle < b.noteTitle) return 1;
    return 0;
  }
};

var NoteListContainer = React.createClass({

  getInitialState() {
    return {
      disableNewNoteButton: false,
      disableCopyButton: false,
      disableTrashButton: false,
      showEmptyMessage: false,
      sortMethod: SortMethods.sortByLastModifiedDate
    };
  },

  componentWillMount() {
    DatabaseStore.addChangeListener(this.onDatabaseChange);
  },

  componentDidMount() {
    $(".nb-toolbar-sort-dropdown").dropdown({
      action: 'hide',
      transition: 'drop'
    });
  },

  componentWillUnmount() {
    DatabaseStore.removeChangeListener(this.onDatabaseChange);
  },

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  },

  render() {
    var sortLastModDateClass = (
        this.state.sortMethod === SortMethods.sortByLastModifiedDate
      ) ? "check icon" : "icon";
    var sortNewestCreatDateClass = (
        this.state.sortMethod === SortMethods.sortByCreationDateNewestFirst
      ) ? "check icon" : "icon";
    var sortOldestCreatDateClass = (
        this.state.sortMethod === SortMethods.sortByCreationDateOldestFirst
      ) ? "check icon" : "icon";
    var sortTitleAscClass = (
        this.state.sortMethod === SortMethods.sortByTitleAscending
      ) ? "check icon" : "icon";
    var sortTitleDscClass = (
        this.state.sortMethod === SortMethods.sortByTitleDescending
      ) ? "check icon" : "icon";

    var moreOpDropdownItems = [
      {
        text: "Copy",
        value: "copy",
        icon: "copy",
        disabled: this.state.disableCopyButton,
        onSelect: this.copyNote
      },
      {
        text: "Trash",
        value: "trash",
        icon: "trash outline",
        disabled: this.state.disableTrashButton,
        onSelect: this.trashNote
      }
    ];

    var emptyMessageHeader =
      DatabaseStore.getSearchString()
        ? "Your search `" + DatabaseStore.getSearchString()
                          + "` did not match any notes."
        : "This notebook is empty.";
    var emptyMessageSuggestions =
      DatabaseStore.getSearchString()
        ? [
            <li key="suggest1">{ "Make sure that all words are spelled correctly." }</li>,
            <li key="suggest2">{ "Try different keywords." }</li>,
            <li key="suggest3">{ "Try more general keywords." }</li>
          ]
        : [
            <li key="suggest1">{ "Click 'New' to create a note." }</li>,
            <li key="suggest2">{ "You will not be able to create a note if a notebook stack is selected." }</li>
          ];

    return (
      <div className="nb-column-container">
        <div className="ui menu nb-column-toolbar">
          <div className="ui compact dropdown item nb-toolbar-sort-dropdown">
            <i className="sort content ascending black icon"></i>
            <div className="menu">
              <div className="item" onClick={this.sortByModifiedDate}>
                <i className={sortLastModDateClass}></i>
                Sort by modified date
              </div>
              <div className="item" onClick={this.sortByCreationDateNewestFirst}>
                <i className={sortNewestCreatDateClass}></i>
                Sort by creation date (newest first)
              </div>
              <div className="item" onClick={this.sortByCreationDateOldestFirst}>
                <i className={sortOldestCreatDateClass}></i>
                Sort by creation date (oldest first)
              </div>
              <div className="item" onClick={this.sortByTitleAscending}>
                <i className={sortTitleAscClass}></i>
                Sort by title (ascending)
              </div>
              <div className="item" onClick={this.sortByTitleDescending}>
                <i className={sortTitleDscClass}></i>
                Sort by title (descending)
              </div>
            </div>
          </div>
          <div className={this.state.disableNewNoteButton
                            ? "ui pointing link disabled item"
                            : "ui pointing link item"}
               onClick={this.writeNote}>
            <i className="edit icon"></i>
            New
          </div>
          <DropdownMenu itemDataSource = {moreOpDropdownItems}
                     iconClass = "ellipsis vertical"
                  useSelectBar = {false} />
        </div>

        <div
          className="nb-notelist-guide"
          style={{display: this.state.showEmptyMessage ? "block" : "none"}}
        >
          <div className="ui info message">
            <div className="header" style={{wordWrap: "break-word"}}>
              {emptyMessageHeader}
            </div>
            <ul className="list">
              <p/><p><strong>Suggestions:</strong></p>
              {emptyMessageSuggestions}
            </ul>
          </div>
        </div>

        <ListViewController
          ref="noteListController"
          className="nb-column-content"
          canManageDataSource={false}
          onDataLoad={this.onListDataLoaded}
          onSelectRow={this.onSelectNote}
          onRenderListViewItem={this.onRenderListViewItem}
        />

        <DialogController
          ref="alertDialog"
          title={this.state.errorTitle}
          message={this.state.errorMessage}
          actionButtons={[{
            title: "Got It",
            color: "red",
            actionType: "approve",
          }]}
          actionButtonsAlign="center"
        />
      </div>
    );
  },

  onDatabaseChange(change) {
    switch (change.actionType) {
      case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK:
        var notebook = change.notebookNode;
        if (notebook &&
             (notebook.id === NotebookConstants.DATABASE_NOTEBOOK_ALL_ID ||
            notebook.isFolder())
        )
          this.setState({ disableNewNoteButton: true });
        else
          this.setState({ disableNewNoteButton: false });

        setTimeout(function() {
          if (!DatabaseStore.getNoteListSortMethod())
            DatabaseActionCreators.setNoteSortMethod(this.state.sortMethod);
          DatabaseActionCreators.loadNotes(notebook);
        }.bind(this), 10);
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
        var notes = DatabaseStore.getNoteDescriptorList();
        this.refs.noteListController.setDataSource(notes);
        if (notes.length === 0)
          this.setState({
            disableCopyButton: true,
            disableTrashButton: true,
            showEmptyMessage: true
          });
        else
          this.setState({
            disableCopyButton: false,
            disableTrashButton: false,
            showEmptyMessage: false
          });
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_SUCCESS:
      case NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_SUCCESS:
        this.refs.noteListController.addRowAtIndex(
          change.noteDescriptor, change.index
        );
        this.setState({
          disableCopyButton: false,
          disableTrashButton: false,
          showEmptyMessage: false
        });
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
        this.refs.noteListController.removeRowAtIndex(change.index);
        if (DatabaseStore.getNoteDescriptorList().length === 0)
          this.setState({
            disableCopyButton: true,
            disableTrashButton: true,
            showEmptyMessage: true
          });
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SET_NOTE_SORT_METHOD:
        this.setState({ sortMethod: DatabaseStore.getNoteListSortMethod() });
        var _i =
          DatabaseStore.getNoteDescriptorIndex(
            DatabaseStore.getSelectedNoteDescriptor()
          );
        if (_i >= 0)
          this.refs.noteListController.selectRowAtIndex(_i);
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE:
        //this.refs.noteListController.setEnable(false);
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS:
        this.refs.noteListController.refresh();
        //this.refs.noteListController.setEnable(true);
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR:
        //this.refs.noteListController.setEnable(true);
      case NotebookActionConstants.NOTEBOOK_DATABASE_LOADTREE_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVETREE_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_CREATE_NOTEBOOK_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTEBOOK_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_ADD_NOTE_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_ERROR:
      case NotebookActionConstants.NOTEBOOK_DATABASE_COPY_NOTE_ERROR:
        this.showErrorAlert(
          "Notebook Database Error",
          "Error Code: " + change.actionType + "\n\n" + DatabaseStore.getError()
        );
        break;
    }
  },

  sortByModifiedDate() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByLastModifiedDate
    );
  },

  sortByCreationDateNewestFirst() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByCreationDateNewestFirst
    );
  },

  sortByCreationDateOldestFirst() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByCreationDateOldestFirst
    );
  },

  sortByTitleAscending() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByTitleAscending
    );
  },

  sortByTitleDescending() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByTitleDescending
    );
  },

  onListDataLoaded() {
    if (this.refs.noteListController.count() > 0)
      this.refs.noteListController.selectRowAtIndex(0);
  },

  onSelectNote(index) {
    setTimeout(function() {
      DatabaseActionCreators.selectNote(index);
    }, 0);
  },

  onRenderListViewItem(data) {
    var _mtime = new Date(data.noteStat.mtime);
    var _lmd = _mtime.toLocaleDateString() + " " + _mtime.toLocaleTimeString();

    return {
      titleText: data.noteTitle,
      subtitleText: _lmd,
      detailText: ''
    };
  },

  writeNote() {
    if (!this.state.disableNewNoteButton)
      DatabaseActionCreators.addNote(
        DatabaseStore.getSelectedNotebookNode(), "", ""
      );
  },

  copyNote() {
    if (!this.state.disableCopyButton)
      DatabaseActionCreators.copyNote(
        DatabaseStore.getSelectedNoteDescriptor()
      );
  },

  trashNote() {
    if (!this.state.disableTrashButton)
      DatabaseActionCreators.trashNote(
        DatabaseStore.getSelectedNoteDescriptor()
      );
  },

  showErrorAlert(errorTitle, errorMessage) {
    this.setState({
      errorTitle: errorTitle,
      errorMessage: errorMessage
    });
    this.refs.alertDialog.show();
  }
});

module.exports = NoteListContainer;
