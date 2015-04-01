var ListViewController = require('framework/cutie/ListView/js/ListViewController.jsx');

var NoteListContainer = React.createClass({

	componentDidMount: function() {
		$(".nb-toolbar-sort-dropdown").dropdown({
			action: 'hide',
            transition: 'drop'
        });

		this.refs.noteListController.setDataSource([
			{
				titleText: "我是牧辰我是牧辰我是牧辰我是牧辰我是牧辰我是牧辰我是牧辰我是牧辰",
				subtitleText: "2015/04/10",
				detailText: "我是牧辰 An excellent companion 我是牧辰我是牧辰 An excellent companion An excellent companion An excellent companion An excellent companion An excellent companion An excellent companion An excellent companion An excellent companion An excellent companion"
			},
			{
				titleText: "Poodle",
				subtitleText: "2015/03/31",
				detailText: "A poodle, its pretty basic"
			},
			{
				titleText: "Paulo",
				subtitleText: "2015/03/28",
				detailText: "He's also a dog"
			}
		]);
	},

	render: function() {
		return (
			<div className="nb-column-container">
				<div className="ui menu nb-column-toolbar">
					<div className="ui pointing dropdown item nb-toolbar-sort-dropdown">
					    <i className="sort content ascending black icon"></i>
					    <div className="menu">
					    	<div className="item">
					    	    <i className="check icon"></i>
					    	    Sort by modified date
					    	</div>
					        <div className="item">
					            <i className="icon"></i>
					            Sort by creation date (newest first)
					        </div>
					        <div className="item">
					            <i className="icon"></i>
					            Sort by creation date (oldest first)
					        </div>
					        <div className="item">
					            <i className="icon"></i>
					            Sort by title (ascending)
					        </div>
					        <div className="item">
					            <i className="icon"></i>
					            Sort by title (descending)
					        </div>
					    </div>
					</div>
				    <div className="ui pointing link item">
				        <i className="edit icon"></i>
				        Write
				    </div>
				    <div className="ui pointing link item">
				        <i className="trash outline icon"></i>
				        Trash
				    </div>
				</div>
				<div className="nb-column-content">
					<ListViewController ref="noteListController" />
				</div>
			</div>
		);
	}

});

module.exports = NoteListContainer;
