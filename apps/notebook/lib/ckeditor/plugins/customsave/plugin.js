/**
 * @fileOverview The CustomSave plugin.
 */

( function() {
	var saveCmd = {
		readOnly: 1,

		exec: function( editor ) {
			editor.fire( 'customsave' );
		}
	};

	var pluginName = 'customsave';

	// Register a plugin named "save".
	CKEDITOR.plugins.add( pluginName, {
		lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
		icons: 'save', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		init: function( editor ) {
			// Save plugin is for replace mode only.
			if ( editor.elementMode != CKEDITOR.ELEMENT_MODE_REPLACE )
				return;

			var command = editor.addCommand( pluginName, saveCmd );
			command.modes = { wysiwyg: 1 };

			editor.ui.addButton && editor.ui.addButton( 'Save', {
				label: editor.lang.customsave.toolbar,
				command: pluginName,
				toolbar: 'document,10'
			} );
		}
	} );
} )();

