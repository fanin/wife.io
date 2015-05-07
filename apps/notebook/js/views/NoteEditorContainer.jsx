var NoteEditorContainer = React.createClass({

	componentDidMount: function() {
		CKEDITOR.config.readOnly = false;
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
	},

	render: function() {
		return (
			<div className="nb-column-container">
				<div className="ui menu nb-column-toolbar">
					<div className="item nb-column-toolbar-title-input">
						<div className="ui transparent left icon input">
							<i className="file text outline icon"></i>
					        <input type="text" placeholder="Untitled..." />
					    </div>
					</div>
				    <div className="right item nb-column-toolbar-search-input">
				    	<div className="ui transparent icon input">
				            <input type="text" placeholder="Search note..." />
				            <i className="search link icon"></i>
				        </div>
				    </div>
				</div>
				<div className="nb-column-content nb-editor-container">
					<textarea id="nb-editor" name="nb-editor" />
                </div>
			</div>
		);
	}

});

module.exports = NoteEditorContainer;
