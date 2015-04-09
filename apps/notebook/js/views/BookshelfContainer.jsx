var JqTreeView            = require('./JqTreeView.jsx');
var StorageStore          = require('../stores/StorageStore');
var NotebookConstants     = require('../constants/NotebookConstants');
var StorageActionCreators = require('../actions/StorageActionCreators');

var BookshelfContainer = React.createClass({

    getInitialState: function() {
        return {
            disks: []
        };
    },

    componentWillMount: function() {
        DiligentAgent.on('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.on('agent.client.stop', this._onDiligentClientStop);
        StorageStore.addChangeListener(this._onStorageChange);
    },

    componentDidMount: function() {
        $(".nb-toolbar-disksel-dropdown").dropdown({
            transition: 'drop',
            onChange: function(value, text, $selectedItem) {
                var _disk = StorageStore.getDiskByUUID(value);
                StorageActionCreators.setWorkingDisk(_disk);
            }
        });
    },

    componentWillUnmount: function() {
        StorageStore.removeChangeListener(this._onStorageChange);
        DiligentAgent.off('agent.client.ready', this._onDiligentClientReady);
        DiligentAgent.off('agent.client.stop', this._onDiligentClientStop);
    },

    _onDiligentClientReady: function() {
        StorageActionCreators.list();
    },

    _onDiligentClientStop: function() {

    },

    _onStorageChange: function(change) {
        this.setState({ disks: StorageStore.getDisks() });
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

        var diskMenuItems = this.state.disks.map(function(disk) {
            var iconClass = disk.isWorkingDisk ? "check icon" : "icon";
            return (
                <div className="item" data-value={disk.uuid} data-text={disk.name}>
                    <i className={iconClass}></i>
                    {disk.name + " (" + disk.type + ")"}
                </div>
            );
        });

        return (
            <div className="nb-column-container">
                <div className="ui menu nb-column-toolbar">
                    <div className="ui pointing dropdown item nb-toolbar-disksel-dropdown">
                        <i className="disk outline icon"></i>
                        <div className="menu">
                            {diskMenuItems}
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
