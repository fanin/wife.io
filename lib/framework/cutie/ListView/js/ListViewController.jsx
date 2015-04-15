var ListViewItem = require('./ListViewItem.jsx')

var ListViewController = React.createClass({

    propTypes: {
        onSelectRow: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {

        };
    },

    getInitialState: function() {
        return {
            dataSource: [],
            selectedRowIndex: 0
        };
    },

    render: function() {
        var items = this.state.dataSource.map(function(data, index) {
            var isActive = (index === this.state.selectedRowIndex);
            return <ListViewItem index={index}
                                active={isActive}
                             titleText={data.titleText}
                          subtitleText={data.subtitleText}
                            detailText={data.detailText}
                              onSelect={this.selectRowAtIndex} />;
        }, this);

        return (
            <div className="ui selection celled list">
                {items}
            </div>
        );
    },

    setDataSource: function(dataList) {
        this.setState({ dataSource: dataList });
    },

    selectRowAtIndex: function(index) {
        if (index < this.state.dataSource.length) {
            this.setState({ selectedRowIndex: index });
            this.props.onSelectRow && this.props.onSelectRow(index);
        }
    },

    addRowAtIndex: function(rowData, index) {
        if (index >= this.state.dataSource.length)
            index = this.state.dataSource.length - 1;

    },

    removeRowAtIndex: function(index) {
        if (index < this.state.dataSource.length)
            ;
    }

});

module.exports = ListViewController;
