function NoteEditor(fileManager) {
    var self = this;

    self.docPath = undefined;
    self.docIndex = -1;
    self.fileManager = fileManager;

    /* Initialize note content */
    $('#note-title-input').prop('disabled', true);

    /* Initialize editor */
    CKEDITOR.replace('note-content-editor');
    CKEDITOR.config.readOnly = true;
    CKEDITOR.config.resize_enabled = false;
    CKEDITOR.config.extraPlugins = 'customsave';
    CKEDITOR.config.removePlugins = 'elementspath, about';
    CKEDITOR.config.skin = 'icy_orange';

    CKEDITOR.on("instanceReady", function(event) {
        var editor = event.editor;

        $('#note-editor').trigger('ready');

        $("#notebook").off("select");
        $("#notebook").on("select", function(event, arg) {
            self.fileManager.readFile(arg.path, "utf8", function(path, data, error) {
                if (error) {
                    console.log("Unable to read " + path);
                    return;
                }

                /* Extract and show title text */
                $('#note-title-input').val($("<div></div>").append(data).find("title").text());
                /* Extract and show html contents inside <body></body> on CKEDITOR */
                CKEDITOR.instances['note-content-editor'].setData(data.match(/\<body[^>]*\>([^]*)\<\/body/m)[1]);

                $('#note-title-input').prop('disabled', false);
                editor.setReadOnly(false);

                self.docPath = arg.path;
                self.docIndex = arg.index;
            });
        });
    });

    CKEDITOR.instances['note-content-editor'].on('customsave', function() {
        if (!self.docPath) return;
        var title = $('#note-title-input').val();
        var context = CKEDITOR.instances['note-content-editor'].getData();
        var doc = "<html><head><title>" + title + "</title></head><body>" + context + "</body></html>";

        self.fileManager.writeFile(self.docPath, doc, function(path, error) {
            if (error)
                alert("Unable to write " + path);
            else {
                $("#notebook").trigger("refresh", self.docIndex);
            }
        });
    });

    CKEDITOR.instances['note-content-editor'].on("maximize", function(state) {
        if (state.data === CKEDITOR.TRISTATE_ON)
            page.navigationBar.hide();
        else
            page.navigationBar.show();
    });
}

NoteEditor.prototype.fitSize = function(width, height) {
    try {
        CKEDITOR.instances['note-content-editor'].resize("100%", height - 28);
    } catch (e) {}
}
