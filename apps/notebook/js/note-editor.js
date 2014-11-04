function NoteEditor(fileManager) {
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
        $('#note-editor').trigger('ready');
    });

    CKEDITOR.instances['note-content-editor'].on('customsave', function() {
        var value = CKEDITOR.instances['note-content-editor'].getData();
        alert(value);
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
