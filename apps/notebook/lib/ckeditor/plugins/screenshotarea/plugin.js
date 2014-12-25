/**
 * @fileOverview The ScreenshotArea plugin.
 */

( function() {
    "use strict";

    var screenshotAreaBase64Image = "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";


    var addScreenshotArea = {
        allowedContent: 'img[*]',
        exec: function( editor ) {
            var fragment = editor.getSelection().getRanges()[0].extractContents();
            var container = CKEDITOR.dom.element.createFromHtml(
                "<img id='new-screenshot-area' src='/apps/b/notebook/img/screenshot-area.png'></img>",
                editor.document
            );
            fragment.appendTo(container);
            editor.insertElement(container);

            var x = 0;
            var y  = 0;

            var obj = container.$;

            while (obj.offsetParent) {
                x += obj.offsetLeft;
                y += obj.offsetTop;
                obj = obj.offsetParent;
            }
            x += obj.offsetLeft;
            y += obj.offsetTop;

            editor.fire( "screenshotarea" , { top: y, left: x, image: screenshotAreaBase64Image });
        }
    };

    var pluginName = 'screenshotarea';

    // Register a plugin named "screenshotarea".
    CKEDITOR.plugins.add( pluginName, {
        lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn',
        icons: 'screenshotarea',
        hidpi: true,
        init: function( editor ) {
            // ScreenshotArea plugin is for replace mode only.
            if ( editor.elementMode != CKEDITOR.ELEMENT_MODE_REPLACE )
                return;

            var command = editor.addCommand( pluginName, addScreenshotArea );
            command.modes = { wysiwyg: 1 };

            editor.ui.addButton && editor.ui.addButton( 'ScreenshotArea', {
                label: editor.lang.screenshotarea.toolbar,
                command: pluginName,
                toolbar: 'document'
            } );
        }
    } );
} )();

