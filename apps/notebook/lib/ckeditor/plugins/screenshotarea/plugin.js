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
                toolbar: 'insert'
            } );
        }
    } );
} )();

