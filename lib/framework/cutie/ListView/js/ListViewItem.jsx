var ListViewItem = React.createClass({

    propTypes: {
        onSelect: React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
        return {
            index: -1,
            active: false,
            titleText: '',
            subtitleText: '',
            detailText: ''
        };
    },

    render: function() {
        var itemClass = this.props.active ? "active item" : "item";
        return (
            <div className={itemClass} onClick={this._onItemClick}>
                <div className="content cutie-listview-content">
                    <div className="cutie-listview-title">{this.props.titleText}</div>
                    <div className="cutie-listview-subtitle">{this.props.subtitleText}</div>
                    {this.props.detailText}
                </div>
            </div>
        );
    },

    _onItemClick: function() {
        this.props.onSelect(this.props.index);
    }

});

module.exports = ListViewItem;
