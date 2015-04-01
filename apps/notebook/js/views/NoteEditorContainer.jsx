var NoteEditorContainer = React.createClass({

	componentDidMount: function() {
		CKEDITOR.config.readOnly = true;
		CKEDITOR.config.resize_enabled = false;
		CKEDITOR.config.extraPlugins = "font,customsave,screenshotarea,dragresize";
		CKEDITOR.config.removePlugins = "format,link,unlink,anchor,elementspath,about";
		CKEDITOR.config.skin = "icy_orange";
		CKEDITOR.addCss(".cke_editable { word-wrap: break-word }");
		CKEDITOR.replace("nb-editor");
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
				<div className="nb-column-content">
					<textarea id="nb-editor" name="nb-editor" />
                </div>
			</div>
		);
	}

});

module.exports = NoteEditorContainer;
