import DatabaseActionCreators from '../actions/DatabaseActionCreators';
import NotebookConstants from '../constants/NotebookConstants';
import NotebookActionConstants from '../constants/NotebookActionConstants';
import DatabaseStore from '../stores/DatabaseStore';
import GritterView from 'lib/cutie/GritterView';
import * as Dialog from 'lib/cutie/Dialog';
import Button from 'lib/cutie/Button';
import { FSURLDiskData } from 'lib/api/FSAPI';

class ProgressBarView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      label: ""
    }
  }

  render() {
    return (
      <div className="ui green progress">
        <div className="bar" style={{width: (this.state.progress + "%")}}></div>
        <div className="label">{this.state.label}</div>
      </div>
    );
  }
}

class FileUploadView extends React.Component {

  static defaultProps = {
    uploadFiles: [],
    onAddFile: function() {},
    onRemoveFile: function(file) {}
  };

  render() {
    var fileTableRows = this.props.uploadFiles.map((file) => {
      return (
        <tr key={file.name}>
          <td>{file.name}</td>
          <td className="center aligned collapsing">{file.type}</td>
          <td className="center aligned collapsing">
            <div onClick={() => { this.props.onRemoveFile(file) }}>
              <i className="remove circle link big red icon" />
            </div>
          </td>
        </tr>
      );
    });

    return (
      <table className="ui celled striped table">
        <thead>
          <tr>
            <th>File Name</th>
            <th className="center aligned collapsing">File Type</th>
            <th className="center aligned collapsing">Remove</th>
          </tr>
        </thead>
        <tbody>
          {fileTableRows}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan="3">
              <Button style="right floated small primary" onClick={this.props.onAddFile}>
                Add File
              </Button>
            </th>
          </tr>
        </tfoot>
      </table>
    );
  }
}

class NotebookEditor extends React.Component {

  componentDidMount() {
    // Override getUrl() due to ckeditor.js is included by apiutil.include() api
    // rather than directly by <script> tag in index.html.
    // Doing this because we wish to keep index.html not modified, so we need to
    // resolve ckeditor base path by ourselves.
    /*CKEDITOR.getUrl = function(resource) {
      // If this is not a full or absolute path.
      if (resource.indexOf( ':/' ) == -1 && resource.indexOf( '/' ) !== 0)
        resource = CKEDITOR.basePath + 'lib/ckeditor/' + resource;
      else if (
        resource.indexOf(CKEDITOR.basePath) == 0 &&
        resource.indexOf('lib/ckeditor/') == -1
      ) {
        resource = CKEDITOR.basePath
                    + resource.replace(CKEDITOR.basePath, 'lib/ckeditor/');
      }

      // Add the timestamp, except for directories.
      if (
        CKEDITOR.timestamp &&
        resource.charAt(resource.length - 1 ) != '/' &&
        !( /[&?]t=/ ).test(resource)
      ) {
        resource +=
          (resource.indexOf( '?' ) >= 0 ? '&' : '?') + 't=' + CKEDITOR.timestamp;
      }

      return resource;
    };
    CKEDITOR.config.contentsCss = 'lib/ckeditor/contents.css';
    */
    CKEDITOR.config.readOnly = true;
    CKEDITOR.config.resize_enabled = false;
    CKEDITOR.config.extraPlugins = "menu,panel,justify,image,tableresize,"
                   + "codesnippet,colorbutton,find,font,mathjax,"
                   + "youtube,blockquote,pastefromword,pastetext,widget,"
                   + "contextmenu,tabletools,enterkey,entities,floatingspace,"
                   + "format,horizontalrule,htmlwriter,indentlist,list,"
                   + "magicline,removeformat,showborders,sourcearea,specialchar,"
                   + "scayt,stylescombo,tab,table,undo,"
                   + "floatpanel,indent,lineutils,listblock,menubutton,"
                   + "richcombo,panelbutton,dragresize,nbsave,nbupload";
    CKEDITOR.config.removePlugins = "about";
    CKEDITOR.config.skin = "moono";
    CKEDITOR.config.codeSnippet_theme = 'xcode';
    CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");
    CKEDITOR.replace("nb-editor", {
      removeButtons: "",
      removeDialogTabs: "image:advanced",
      toolbar: [
        [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-',
          'Undo', 'Redo', '-',
          'Find', 'Replace', '-',
          'Scayt', '-',
          'NumberedList', 'BulvaredList', '-',
          'Table', 'HorizontalRule', 'SpecialChar', 'CodeSnippet', 'MathJax', '-',
          'Youtube', 'wenzgmap', 'Image', '-',
          'Upload','Save' ], '/',
        [ 'Font', 'FontSize', 'Bold', 'Italic', 'Underline', 'Strike',
          'Subscript', 'Superscript', 'TextColor', 'BGColor', '-',
          'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-',
          'Indent', 'Outdent', '-',
          'Blockquote', '-',
          'RemoveFormat' ]
      ]
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return false;
  }

  componentWillUnmount() {

  }

  render() {
    return (
      <div className="nb-column-content nb-editor-container">
        <textarea id="nb-editor" name="nb-editor" />
      </div>
    );
  }
}

export default class NoteEditorContainer extends React.Component {

  static defaultProps = {
    takeSnapshot: false,
    snapshotImageWidth: 800
  };

  constructor(props) {
    super(props);
    this.state = {
      searchString: "",
      errorTitle: "",
      errorMessage: "",
      uploadFiles: []
    };
    this.editorInstance = null;
    this.titleInputInstance = null;
    this.searchInputInstance = null;
    this._setDataDelayTimer = null;
    this._flushTimer = null;
    this._flushAfterDelay = 5000;
    this._dragStartInsideEditor = false;
    this._unsupportFiles = [];

    this.onDatabaseChange = this.onDatabaseChange.bind(this);
  }

  componentWillMount() {
    DatabaseStore.addChangeListener(this.onDatabaseChange);
  }

  componentDidMount() {
    this.titleContainerInstance = $(".nb-column-toolbar-title-container");
    this.titleInputInstance = $(".nb-column-toolbar-title-input");
    this.searchContainerInstance = $(".nb-column-toolbar-search-container");
    this.searchInputInstance = $(".nb-column-toolbar-search-input");
    this.editorDimmerInstance = $(".nb-editor-dimmer").dimmer({ closable: false });
    this.editorDimmerTextInstance = $(".nb-editor-dimmer > div");
    this.snapshotContainerInstance = $(".nb-snapshot-container");
    this.snapshotBodyContainerInstance = $(".nb-snapshot-container > div");
    this.snapshotBodyInstance = $(".nb-snapshot-container > div > div");
    this.snapshotContainerInstance.width(this.props.snapshotImageWidth);

    /* Prevent drag and drop on non-editor components */
    $(document).on('dragenter', (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    });

    $(document).on('dragover', (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    });

    $(document).on('drop', (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    });

    this.searchInputInstance.keypress((e) => {
      var keycode = (e.keyCode ? e.keyCode : e.which);
      if (keycode === 13)
        this.onSearch();
      return true;
    });

    CKEDITOR.on("instanceReady", (e) => {
      var editor = e.editor;

      this.editorInstance = editor;

      this.titleInputInstance.on('change keyup paste', () => {
        this.cacheDirtyNote();
      });

      this.titleInputInstance.focusout(() => {
        this.saveNote();
      });

      editor.on("contentDom", () => {
        editor.document.on("drop", (e) => {
          if (this._dragStartInsideEditor) {
            this._dragStartInsideEditor = false;
            /**
             * NOTE:
             * drag inside editor won't trigger 'change' event,
             * here calls inserText to force editor content change.
             */
            editor.insertText("");
            return;
          }

          e.data.preventDefault();

          if (editor.readOnly)
            return;

          var files = e.data.$.target.files || e.data.$.dataTransfer.files;

          DatabaseActionCreators.attachFilesToNote(
            DatabaseStore.getSelectedNoteDescriptor(), files
          );
        });

        editor.document.on("dragover", (e) => {
          editor.focus();
        });
        // For IE
        //editor.document.getBody().on("drop", dropFiles);
        //editor.document.getBody().on("dragover", dragoverEffect);

        editor.document.on("dragstart", () => {
          this._dragStartInsideEditor = true;
        });

        //editor.focus();
      });

      editor.on("paste", (e) => {
        e.stop();
        var data = e.data.dataValue;
        /*
         * Remove single &nbsp; between tags on paste to prevent problems from
         * ckeditor parsing the html content
         */
        editor.insertHtml(data.replace(/\>&nbsp;\</gi,'\>\<'));
      });

      editor.on("change", () => {
        if (!this.isReadOnly())
          this.cacheDirtyNote();
      });

      editor.on("blur", () => {
        this.cacheDirtyNote();
      });

      editor.on("nbsave", () => {
        if (!this.isReadOnly()) {
          this.saveNote(null, true);
        }
      });

      editor.on("nbupload", () => {
        if (!this.isReadOnly())
          this.refs.fileUploadDialog.show();
      });

      editor.on("maximize", (state) => {
        if (state.data === CKEDITOR.TRISTATE_ON)
          ;
      });
    });
  }

  componentWillUnmount() {
    DatabaseStore.removeChangeListener(this.onDatabaseChange);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.searchString && !this.state.searchString) {
      /* Restore search input box */
      this.onSearchInputBlur();
    }
    else if (prevState.errorTitle !== this.state.errorTitle ||
             prevState.errorMessage !== this.state.errorMessage) {
      this.refs.alertDialog.show();
    }
  }

  onSearchInputFocus() {
    //var searchWidth = this.titleContainerInstance.parent().width() / 2;
    //if (searchWidth < 150) searchWidth = 150;
    //var titleWidth = this.titleContainerInstance.parent().width() - searchWidth;
    this.titleContainerInstance.animate(
      { width: "30%" },
      { duration: 300, queue: false }
    );
    this.searchContainerInstance.animate(
      { width: "70%" },
      { duration: 300, queue: false }
    );
  }

  onSearchInputBlur() {
    if (!this.state.searchString) {
      //var titleWidth = this.titleContainerInstance.parent().width() - 150;
      this.titleContainerInstance.animate(
        { width: "70%" },
        { duration: 300, queue: false }
      );
      this.searchContainerInstance.animate(
        { width: "30%" },
        { duration: 300, queue: false }
      );
    }
  }

  onSearch() {
    var notebookNode;

    if (this.state.searchString)
      notebookNode = DatabaseStore.getSelectedNotebookNode();
    else
      notebookNode = DatabaseStore.getSuperNotebookNode();

    if (!this.state.searchString) {
      var searchPattern = this.searchInputInstance.val();
      if (searchPattern) {
        this.setState({ searchString: searchPattern });
        DatabaseActionCreators.loadNotes(notebookNode, searchPattern);
      }
    }
    else {
      this.searchInputInstance.val("");
      this.setState({ searchString: "" });
      DatabaseActionCreators.loadNotes(notebookNode);
    }
  }

  setEditorDimmer(show, text) {
    var animating = this.editorDimmerInstance.hasClass("active");

    if (show && !animating) {
      this.editorDimmerTextInstance.text(text);
      this.editorDimmerInstance
          .removeClass("hidden")
          .addClass("visible active");
    }
    else if (!show && animating) {
      this.editorDimmerInstance
          .removeClass("visible")
          .removeClass("active")
          .addClass("hidden");
    }
  }

  setEditorContent(title, content, cb) {
    if (this._setDataDelayTimer)
      clearTimeout(this._setDataDelayTimer);

    this._setDataDelayTimer = setTimeout(() => {
      this._setDataDelayTimer = undefined;
      /* Avoid memory leak */
      this.editorInstance.document.clearCustomData();
      this.editorInstance.document.removeAllListeners();
      this.editorInstance.window.getFrame().clearCustomData();
      this.editorInstance.window.getFrame().removeAllListeners();
      /* Set content data */
      this.editorInstance.setData(content);
      /* Set title */
      this.titleInputInstance.val(title);
      /* Reset undo history */
      this.editorInstance.undoManager.reset();
      /* callback */
      cb && cb();
    }, 10);
  }

  setReadOnly(readOnly) {
    this.titleInputInstance.prop("disabled", readOnly);
    this.editorInstance.setReadOnly(readOnly);
  }

  isReadOnly() {
    return this.titleInputInstance.is(':disabled');
  }

  readNote() {
    setTimeout(() => {
      DatabaseActionCreators.readNote(DatabaseStore.getSelectedNoteDescriptor());
    }, 0);
  }

  saveNote(noteDescriptor, manually) {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }

    noteDescriptor = noteDescriptor || DatabaseStore.getSelectedNoteDescriptor();
    setTimeout(() => {
      DatabaseActionCreators.saveNote(noteDescriptor, manually);
    }, 0);
  }

  flushDirtyNotes() {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }

    var dirtyNoteDescriptors = DatabaseStore.getDirtyNoteDescriptorList();

    for (let i = 0; i < dirtyNoteDescriptors.length; i++) {
      if (DatabaseStore.getNoteDescriptorStatus(dirtyNoteDescriptors[i])
          !== 'Saving')
        this.saveNote(dirtyNoteDescriptors[i]);
    }
  }

  cacheDirtyNote() {
    if (this.isReadOnly())
      return;

    DatabaseActionCreators.cacheDirtyNote(
      DatabaseStore.getSelectedNoteDescriptor(),
      this.titleInputInstance.val(),
      this.editorInstance.getData()
    );

    if (this._flushTimer)
      clearTimeout(this._flushTimer);

    this._flushTimer = setTimeout(() => {
      this.flushDirtyNotes();
    }, this._flushAfterDelay);
  }

  takeSnapshot(noteDescriptor) {
    //var _ckeFrame = $(".cke_wysiwyg_frame").contents().find("body");
    this.snapshotBodyInstance.empty();
    this.snapshotBodyInstance.append(noteDescriptor.noteContent);
    setTimeout(() => {
      DatabaseActionCreators.takeNoteSnapshot(
        noteDescriptor,
        this.snapshotContainerInstance,
        /* BUG: specify width will make snapshot image cropped */
        null,
        /* height need to plus #app-main-view:padding-top */
        this.snapshotBodyContainerInstance.height() + 40
      );
    }, 1);
  }

  handleSaveSuccess(noteDescriptor, manually) {
    if (DatabaseStore.isNoteDescriptorSelected(noteDescriptor)) {
      this.setEditorDimmer(false);
    }
    else {
      DatabaseActionCreators.renewNoteModifyDate(noteDescriptor);
      DatabaseActionCreators.clearUselessAssets(noteDescriptor, 0);
    }

    if (manually)
      GritterView.add(
        "Note Saved",
        noteDescriptor.noteTitle,
        "/apps/ia/notebook/img/icon.png",
        2000
      );

    setTimeout(() => { this.flushDirtyNotes() }, 0);
  }

  onUploadDialogFileInputChange() {
    var files = $("#upload-files")[0].files;
    var list = this.state.uploadFiles;

    for (let i = 0; i < files.length; i++) {
      list.push(files[i]);
    }

    this.setState({ uploadFiles: list });
  }

  onUploadDialogAddFile() {
    $("#upload-files").click();
  }

  onUploadDialogRemoveFile(file) {
    var files = this.state.uploadFiles;
    files.splice(files.indexOf(file), 1);
    this.setState({ uploadFiles: files });
  }

  onUploadDialogApprove() {
    var files = this.state.uploadFiles;
    if (files.length > 0) {
      DatabaseActionCreators.attachFilesToNote(
        DatabaseStore.getSelectedNoteDescriptor(), files
      );
    }
  }

  onUploadDialogShow() {}

  onUploadDialogHidden() {
    $("#upload-files").replaceWith($("#upload-files").clone());
    this.setState({ uploadFiles: [] });
  }

  onProgressDialogCancelUpload() {
    DatabaseActionCreators.cancelAttachFile(
      DatabaseStore.getSelectedNoteDescriptor()
    );
  }

  onProgressDialogHidden() {
    if (this._unsupportFiles.length > 0) {
      this.showErrorAlert(
        "Attach File Error",
        "File format is not supported:\n\n" + this._unsupportFiles.join(", ")
      );
      this._unsupportFiles = [];
    }
  }

  showErrorAlert(errorTitle, errorMessage) {
    this.setState({
      errorTitle: errorTitle,
      errorMessage: errorMessage
    });
  }

  onDatabaseChange(change) {
    switch (change.actionType) {
      case NotebookActionConstants.NOTEBOOK_DATABASE_OPEN:
        var timer = setInterval(() => {
          if (this.editorInstance) {
            clearInterval(timer);
            DatabaseActionCreators.loadTree();
          }
        }, 100);
        break;
      case NotebookActionConstants.NOTEBOOK_DATABASE_LOADNOTES_SUCCESS:
      case NotebookActionConstants.NOTEBOOK_DATABASE_TRASH_NOTE_SUCCESS:
        var notes = DatabaseStore.getNoteDescriptorList();
        if (notes.length === 0) {
          this.flushDirtyNotes();
          this.setReadOnly(true);
          this.setEditorDimmer(false);
          this.setEditorContent("", "", () => {});
        }
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTEBOOK:
        this.searchInputInstance.val("");
        this.setState({ searchString: "" });
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
        this.flushDirtyNotes();
        this.readNote();
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE:
        if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor)) {
          var status = DatabaseStore.getNoteDescriptorStatus(change.noteDescriptor);
          this.setEditorDimmer(true, status);
          this.setReadOnly(true);
          if (status === 'Saving')
            this.setEditorContent(
              change.noteDescriptor.dirtyNoteTitle ||
              change.noteDescriptor.noteTitle,
              change.noteDescriptor.dirtyNoteContent ||
              change.noteDescriptor.noteContent
            );
        }
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE:
        if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor)) {
          if (change.noteDescriptor.saveManually) {
            this.setEditorDimmer(
              true,
              DatabaseStore.getNoteDescriptorStatus(change.noteDescriptor)
            );
            this.setReadOnly(true);
          }
        }
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_SUCCESS:
        if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor)) {
          this.setEditorContent(
            change.noteDescriptor.dirtyNoteTitle ||
            change.noteDescriptor.noteTitle,
            change.noteDescriptor.dirtyNoteContent ||
            change.noteDescriptor.noteContent,
            () => {
              if (!DatabaseStore.getNoteDescriptorStatus(change.noteDescriptor)) {
                this.setEditorDimmer(false);
                this.setReadOnly(false);
              }
            }
          );
        }
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_SUCCESS:
        if (DatabaseStore.isNoteDescriptorSelected(change.noteDescriptor))
          this.setReadOnly(false);
        if (this.props.takeSnapshot)
          this.takeSnapshot(change.noteDescriptor);
        else
          this.handleSaveSuccess(change.noteDescriptor, change.manually);
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_TAKE_NOTE_SNAPSHOT_SUCCESS:
        this.handleSaveSuccess(change.noteDescriptor);
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE:
        this.refs.uploadProgressDialog.show();
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_PROGRESS:
        this.refs.progressBarView.setState({
          progress: change.noteDescriptor.uploadOverallProgress,
          label: "Uploading " + change.noteDescriptor.uploadFileObject.name
        });

        if (change.noteDescriptor.uploadProgress === 100) {
          var _file = change.noteDescriptor.uploadFileObject;
          var _path = '/Applications/notebook/' + change.noteDescriptor.fileUploadPath;

          if (_file.type.toLowerCase().indexOf("image") === 0) {
            var _editor = this.editorInstance;
            var _urlCreator = window.URL || window.webkitURL;
            var _imageUrl = _urlCreator.createObjectURL(_file);
            var _img = document.createElement("img");

            if (DatabaseStore.getStorage().type === 'Removable Disk') {
              _path = FSURLDiskData(DatabaseStore.getStorage().uuid, _path);
            }

            _img.onload = function() {
              var _targetWidth = this.width;
              var _targetHeight = this.height;
              var _maxWidth = $(".cke_wysiwyg_frame").width() * 0.8;
              if (this.width > _maxWidth) {
                _targetHeight = (this.height / this.width) * _maxWidth;
                _targetWidth = _maxWidth;
              }

              _editor.insertHtml(
                /**
                 * Compose the FSAPI url to access file in userdata.
                 */
                "<img src='/api/v1/fs/file/" + encodeURIComponent(_path)
                  + "' style='width:" + _targetWidth
                  + "px; height:" + _targetHeight + "px'/>"
              );
            }
            _img.src = _imageUrl;
          }
          else {
            this._unsupportFiles.push(_file.name);
          }
        }

        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_SUCCESS:
        this.refs.uploadProgressDialog.hide();
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_ATTACH_FILE_TO_NOTE_ERROR:
        this._unsupportFiles.push(change.file.name);
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_CANCEL_ATTACH_FILE_TO_NOTE:
        this.refs.uploadProgressDialog.hide();
        break;

      case NotebookActionConstants.NOTEBOOK_DATABASE_SAVE_NOTE_ERROR:
        this.flushDirtyNotes();
      case NotebookActionConstants.NOTEBOOK_DATABASE_READ_NOTE_ERROR:
        this.setEditorDimmer(false);
        if (DatabaseStore.getError() &&
            DatabaseStore.getError().indexOf("Invalid Format") > 0)
          this.showErrorAlert(
            "Notebook Database Error",
            "Error Code: " + change.actionType + "\n\n" + DatabaseStore.getError()
          );
        else
          this.showErrorAlert(
            "Notebook Database Error",
            "Error Code: " + change.actionType + "\n\n" + DatabaseStore.getError()
          );
        break;
    }
  }

  render() {
    return (
      <div className="nb-column-container">
        <div className="nb-snapshot-container">
          <div>
            <div />
          </div>
        </div>

        <div className="ui inverted dimmer nb-editor-dimmer">
          <div className="ui text loader"></div>
        </div>

        <div className="ui menu nb-column-toolbar">
          <div className="item nb-column-toolbar-title-container">
            <div className="ui transparent left icon input">
              <i className="file text outline icon"></i>
              <input
                className="nb-column-toolbar-title-input"
                type="text"
                placeholder="Untitled..."
                disabled
              />
            </div>
          </div>
          <div className="right item nb-column-toolbar-search-container">
            <div className={"ui transparent icon input"
                              + (this.state.searchString ? " search" : "")}>
              <input
                className="nb-column-toolbar-search-input"
                type="text"
                placeholder="Search note..."
                onFocus={this.onSearchInputFocus.bind(this)}
                onBlur={this.onSearchInputBlur.bind(this)}
                disabled={this.state.searchString ? " disabled" : ""}
              />
              <i
                className={(this.state.searchString ? "remove" : "search")
                            + " link icon nb-column-toolbar-search-button"}
                 onClick={this.onSearch.bind(this)}
              />
            </div>
          </div>
        </div>

        <NotebookEditor />

        <input
          type="file"
          id="upload-files"
          style={{display: "none"}}
          onChange={this.onUploadDialogFileInputChange.bind(this)}
          multiple
        />

        <Dialog.Container
          ref="fileUploadDialog"
          size="large"
          onVisible={this.onUploadDialogShow.bind(this)}
          onHidden={this.onUploadDialogHidden.bind(this)}
          onApprove={this.onUploadDialogApprove.bind(this)}
        >
          <Dialog.Header>Select Files to Upload</Dialog.Header>
          <Dialog.Content>
            <FileUploadView
              uploadFiles={this.state.uploadFiles}
              onAddFile={this.onUploadDialogAddFile.bind(this)}
              onRemoveFile={this.onUploadDialogRemoveFile.bind(this)}
            />
          </Dialog.Content>
          <Dialog.ButtonSet>
            <Button style="labeled icon" icon="remove" color="red" classes="deny">
              Cancel
            </Button>
            <Button style="labeled icon" icon="upload" color="green" classes="approve">
              Upload
            </Button>
          </Dialog.ButtonSet>
        </Dialog.Container>

        <Dialog.Container
          ref="uploadProgressDialog"
          onHidden={this.onProgressDialogHidden.bind(this)}
          onDeny={this.onProgressDialogCancelUpload.bind(this)}
        >
          <Dialog.Header>File Upload Progress</Dialog.Header>
          <Dialog.Content>
            <ProgressBarView ref="progressBarView" />
          </Dialog.Content>
          <Dialog.ButtonSet>
            <Button style="labeled icon" icon="remove" color="red" classes="deny">
              Cancel
            </Button>
          </Dialog.ButtonSet>
        </Dialog.Container>

        <Dialog.Container ref="alertDialog">
          <Dialog.Header>{this.state.errorTitle}</Dialog.Header>
          <Dialog.Content>
            {this.state.errorMessage}
          </Dialog.Content>
          <Dialog.ButtonSet>
            <Button style="labeled icon" icon="remove" color="red" classes="deny">
              Got It
            </Button>
          </Dialog.ButtonSet>
        </Dialog.Container>
      </div>
    );
  }
}
