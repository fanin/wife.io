var DatabaseActionCreators = require("../actions/DatabaseActionCreators");
var NotebookConstants      = require("../constants/NotebookConstants");
var DatabaseStore          = require("../stores/DatabaseStore");

var setDataDelayTimeout;

var NoteEditorContainer = React.createClass({
    editorInstance: null,
    titleInputInstance: null,
    searchInputInstance: null,

    componentWillMount: function () {
        DatabaseStore.addChangeListener(this._onDatabaseChange);
    },

    componentDidMount: function() {
        this.searchButtonInstance = $(".nb-column-toolbar-search-button");
        this.searchInputInstance = $(".nb-column-toolbar-search-input");
        this.titleInputInstance = $(".nb-column-toolbar-title-input");
        this.titleInputInstance.prop("disabled", true);

        CKEDITOR.config.readOnly = true;
        CKEDITOR.config.resize_enabled = false;
        CKEDITOR.config.extraPlugins = "customsave,screenshotarea,dragresize,tableresize,justify";
        CKEDITOR.config.removePlugins = "uploadcare,image,link,unlink,anchor,elementspath,about";
        CKEDITOR.config.skin = "minimalist";
        CKEDITOR.config.codeSnippet_theme = 'xcode';
        CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");
        CKEDITOR.replace("nb-editor", {
            removeButtons: "Source, Maximize",
            toolbar: [
                [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-',
                  'Undo', 'Redo', '-',
                  'Find', 'Replace', '-',
                  'Scayt', '-',
                  'NumberedList', 'BulletedList', '-',
                  'Table', 'HorizontalRule', 'SpecialChar', 'CodeSnippet', 'MathJax', '-',
                  'Youtube', 'wenzgmap', 'ScreenshotArea', '-',
                  'Save' ],
                '/',
                [ 'Font', 'FontSize', 'Bold', 'Italic', 'Underline', 'Strike',
                  'Subscript', 'Superscript', 'TextColor', 'BGColor', '-',
                  'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-',
                  'Indent', 'Outdent', '-',
                  'Blockquote', '-',
                  'RemoveFormat' ]
            ]
        });

        CKEDITOR.on("instanceReady", function(event) {
            var editor = event.editor;

            this.titleInputInstance.on('change keyup paste', function() {

            });

            this.titleInputInstance.focusout(function() {

            });

            editor.on("contentDom", function() {
                // For Firefox/Chrome
                //editor.document.on("drop", dropFiles);
                //editor.document.on("dragover", dragoverEffect);
                // For IE
                //editor.document.getBody().on("drop", dropFiles);
                //editor.document.getBody().on("dragover", dragoverEffect);

                editor.focus();
            });

            editor.on("paste", function(event) {
                event.stop();
                var data = event.data.dataValue;
                /* Remove single &nbsp; between tags on paste to prevent problems from ckeditor parsing the html content */
                event.editor.insertHtml(data.replace(/\>&nbsp;\</gi,'\>\<'));
                //editorChangeHandler();
            });

            editor.on("change", function() {
                /* Ignore the change event which is fired by setContentNoLagWorkaround */
                //if (!self.status.busy)
                //    editorChangeHandler();
            });

            editor.on("customsave", function() {
                //editorSaveHandler();
            });

            editor.on("screenshotarea", function(event) {
                var area = event.data;
                //var screenshotId = "screenshot-" + self.getTimecode();

                /* Save a screenshot-area.png copy for this screenshot area in userdata storage */
                /*self.fileManager.writeFile(
                    dirname(self.noteObject.path) + "/assets/" + screenshotId + ".png",
                    base64ToBlob(area.image),
                    function(path, progress, error) {
                        if (error)
                            console.log("Unable to write screenshot-area.png to " + path + " (error = " + error + ")");
                        else {
                            var screenshotarea = editor.document.getById("new-screenshot-area");
                            screenshotarea.setAttribute("src", "userdata/" + path + (self.storageUUID ? "?uuid=" + self.storageUUID : ""));
                            screenshotarea.setAttribute("id", screenshotId);
                        }
                    }
                );*/
            });

            editor.on("maximize", function(state) {
                if (state.data === CKEDITOR.TRISTATE_ON)
                    ;
            });

            this.editorInstance = editor;
        }.bind(this));
    },

    componentWillUnmount: function() {
        DatabaseStore.removeChangeListener(this._onDatabaseChange);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return false;
    },

    render: function() {
        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <div className="item nb-column-toolbar-title-container">
                        <div className="ui transparent left icon input">
                            <i className="file text outline icon"></i>
                            <input className="nb-column-toolbar-title-input" type="text" placeholder="Untitled..." />
                        </div>
                    </div>
                    <div className="right item nb-column-toolbar-search-container">
                        <div className="ui transparent icon input">
                            <input className="nb-column-toolbar-search-input" type="text" placeholder="Search note..." />
                            <i className="search link icon nb-column-toolbar-search-button"></i>
                        </div>
                    </div>
                </div>
                <div className="nb-column-content nb-editor-container">
                    <textarea id="nb-editor" name="nb-editor" />
                </div>
            </div>
        );
    },

    _setEditorContent: function(title, content, cb) {
        if (setDataDelayTimeout) clearTimeout(setDataDelayTimeout);
        setDataDelayTimeout = setTimeout(function() {
            setDataDelayTimeout = undefined;
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
        }.bind(this), 100);
    },

    _onDatabaseChange: function(change) {
        switch (change.actionType) {
            case NotebookConstants.NOTEBOOK_DATABASE_SELECT_NOTE:
                setTimeout(function() {
                    DatabaseActionCreators.loadNoteContent(DatabaseStore.getSelectedNoteDescriptor());
                }, 1);
                break;
            case NotebookConstants.NOTEBOOK_DATABASE_LOAD_NOTE_CONTENT_SUCCESS:
                var noteDescriptor = change.noteDescriptor;

                this._setEditorContent(noteDescriptor.noteTitle, noteDescriptor.noteContent, function() {
                    this.titleInputInstance.prop("disabled", false);
                    this.editorInstance.setReadOnly(false);
                }.bind(this));

                break;
        }
    }

});

module.exports = NoteEditorContainer;
