var JqTreeView = require('./JqTreeView.jsx');

var BookshelfContainer = React.createClass({

	componentDidMount: function() {
		$(".nb-toolbar-bookshelf-dropdown").dropdown({
			action: 'hide',
            transition: 'drop'
        });

        $(".nb-toolbar-disksel-dropdown").dropdown({
        	action: 'hide',
            transition: 'drop'
        });
	},

	render: function() {
		var data = [
		    {
		        label: 'node1',
		        children: [
		            { label: 'child1' },
		            { label: 'child2' }
		        ]
		    },
		    {
		        label: 'node2',
		        children: [
		            { label: 'child3' }
		        ]
		    },
		    {
		        label: 'node2',
		        children: [
		            { label: 'child3' }
		        ]
		    },
		    {
		        label: 'kenny',
		        children: [
		            { label: 'muchen' }
		        ]
		    }
		];

		return (
			<div className="nb-column-container">
				<div className="ui menu nb-column-toolbar">
				    <div className="ui pointing dropdown item nb-toolbar-disksel-dropdown">
				        <i className="disk outline icon"></i>
				        <div className="menu">
				            <div className="item">
				                <i className="check icon"></i>
				                System
				            </div>
				            <div className="item">
				                <i className="icon"></i>
				                User
				            </div>
				            <div className="item">
				                <i className="icon"></i>
				                External
				            </div>
				        </div>
				    </div>
				    <div className="ui pointing link item">
				        <i className="plus icon"></i>
				        New
				    </div>
				    <div className="ui pointing link item">
				        <i className="write icon"></i>
				        Rename
				    </div>
				</div>
				<div className="nb-column-content">
					<JqTreeView data={data} />
				</div>
			</div>
		);
	}

});

module.exports = BookshelfContainer;
