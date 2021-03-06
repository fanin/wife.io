( function() {
    var uploadCmd = {
        readOnly: 1,

        exec: function( editor ) {
            editor.fire( 'nbupload' );
        }
    };

    var pluginName = 'nbupload';

    CKEDITOR.plugins.add( pluginName, {
        lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
        icons: 'upload',
        hidpi: true,
        init: function( editor ) {
            var command = editor.addCommand( pluginName, uploadCmd );
            command.modes = { wysiwyg: 1 };

            editor.ui.addButton && editor.ui.addButton( 'Upload', {
                label: editor.lang.nbupload.toolbar,
                command: pluginName,
                toolbar: 'document'
            } );
        }
    } );
} )();

