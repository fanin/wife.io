import DatabaseActionCreators from '../actions/DatabaseActionCreators';
import NotebookConstants from '../constants/NotebookConstants';
import NotebookActionConstants from '../constants/NotebookActionConstants';
import DatabaseStore from '../stores/DatabaseStore';
import ListViewController from 'lib/cutie/ListView';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import Dropdown from 'lib/cutie/Dropdown';

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

export default class NoteListContainer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      disableNewNoteButton: false,
      disableCopyButton: false,
      disableTrashButton: false,
      showEmptyMessage: false,
      sortMethod: SortMethods.sortByLastModifiedDate
    };
  }

  componentWillMount() {
    DatabaseStore.addChangeListener(this.onDatabaseChange.bind(this));
  }

  componentWillUnmount() {
    DatabaseStore.removeChangeListener(this.onDatabaseChange);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

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

        setTimeout(() => {
          if (!DatabaseStore.getNoteListSortMethod())
            DatabaseActionCreators.setNoteSortMethod(this.state.sortMethod);
          DatabaseActionCreators.loadNotes(notebook);
        }, 10);
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
        let i = DatabaseStore.getNoteDescriptorIndex(
          DatabaseStore.getSelectedNoteDescriptor()
        );
        if (i >= 0)
          this.refs.noteListController.selectRowAtIndex(i);
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
  }

  sortByModifiedDate() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByLastModifiedDate
    );
  }

  sortByCreationDateNewestFirst() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByCreationDateNewestFirst
    );
  }

  sortByCreationDateOldestFirst() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByCreationDateOldestFirst
    );
  }

  sortByTitleAscending() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByTitleAscending
    );
  }

  sortByTitleDescending() {
    DatabaseActionCreators.setNoteSortMethod(
      SortMethods.sortByTitleDescending
    );
  }

  onListDataLoaded() {
    if (this.refs.noteListController.count() > 0)
      this.refs.noteListController.selectRowAtIndex(0);
  }

  onSelectNote(index) {
    setTimeout(() => {
      DatabaseActionCreators.selectNote(index);
    }, 0);
  }

  onRenderListViewItem(data) {
    var _mtime = new Date(data.noteStat.mtime);
    var _lmd = _mtime.toLocaleDateString() + " " + _mtime.toLocaleTimeString();

    return {
      titleText: data.noteTitle,
      subtitleText: _lmd,
      detailText: ''
    };
  }

  writeNote() {
    if (!this.state.disableNewNoteButton)
      DatabaseActionCreators.addNote(
        DatabaseStore.getSelectedNotebookNode(), "", ""
      );
  }

  copyNote() {
    if (!this.state.disableCopyButton)
      DatabaseActionCreators.copyNote(
        DatabaseStore.getSelectedNoteDescriptor()
      );
  }

  trashNote() {
    if (!this.state.disableTrashButton)
      DatabaseActionCreators.trashNote(
        DatabaseStore.getSelectedNoteDescriptor()
      );
  }

  showErrorAlert(errorTitle, errorMessage) {
    this.setState({
      errorTitle: errorTitle,
      errorMessage: errorMessage
    });
    this.refs.alertDialog.show();
  }

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
          <Dropdown
            classes="compact item nb-toolbar-sort-dropdown"
            buttonIconClass="sort content ascending black"
            itemSelectBar={true}
            transition="drop"
            onChange={(value, text) => {
              switch (value) {
              case 'modified-date':
                this.sortByModifiedDate();
                break;
              case 'creation-date-new':
                this.sortByCreationDateNewestFirst();
                break;
              case 'creation-date-old':
                this.sortByCreationDateOldestFirst();
                break;
              case 'title-asc':
                this.sortByTitleAscending();
                break;
              case 'title-dsc':
                this.sortByTitleDescending();
                break;
              }
            }}
          >
            <div key="modified-date" data-value="modified-date" className="item">
              <i className={sortLastModDateClass}></i>
              Sort by modified date
            </div>
            <div key="creation-date-new" data-value="creation-date-new" className="item">
              <i className={sortNewestCreatDateClass}></i>
              Sort by creation date (newest first)
            </div>
            <div key="creation-date-old" data-value="creation-date-old" className="item">
              <i className={sortOldestCreatDateClass}></i>
              Sort by creation date (oldest first)
            </div>
            <div key="title-asc" data-value="title-asc" className="item">
              <i className={sortTitleAscClass}></i>
              Sort by title (ascending)
            </div>
            <div key="title-dsc" data-value="title-dsc" className="item">
              <i className={sortTitleDscClass}></i>
              Sort by title (descending)
            </div>
          </Dropdown>
          <div
            className={this.state.disableNewNoteButton
                        ? "ui pointing link disabled item"
                        : "ui pointing link item"}
            onClick={this.writeNote.bind(this)}
          >
            <i className="edit icon"></i>
            New
          </div>
          <Dropdown
            classes="compact link item"
            buttonIconClass="ellipsis vertical"
            itemSelectBar={false}
            transition="drop"
            onChange={(value, text) => {
              switch (value) {
              case 'copy':
                if (!this.state.disableCopyButton)
                  this.copyNote();
                break;
              case 'trash':
                if (!this.state.disableTrashButton)
                  this.trashNote();
                break;
              }
            }}
          >
            <div
              className={ this.state.disableCopyButton ? "disabled item" : "item" }
              key="copy"
              data-value="copy"
            >
              <i className="write icon" />
              Copy
            </div>
            <div
              className={ this.state.disableTrashButton ? "disabled item" : "item" }
              key="trash"
              data-value="trash"
            >
              <i className="trash outline icon" />
              Trash
            </div>
          </Dropdown>
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
          onDataLoad={this.onListDataLoaded.bind(this)}
          onSelectRow={this.onSelectNote.bind(this)}
          onRenderListViewItem={this.onRenderListViewItem.bind(this)}
        />

        <Dialog.Container ref="alertDialog">
          <Dialog.Header>{this.state.errorTitle}</Dialog.Header>
          <Dialog.Content>
            {this.state.errorMessage}
          </Dialog.Content>
          <Dialog.ButtonSet>
            <Button color="red" classes="approve">
              Got It
            </Button>
          </Dialog.ButtonSet>
        </Dialog.Container>
      </div>
    );
  }
}
