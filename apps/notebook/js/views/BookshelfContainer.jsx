var JqTreeView            = require('./JqTreeView.jsx');
var StorageStore          = require('../stores/StorageStore');
var NotebookConstants     = require('../constants/NotebookConstants');
var StorageActionCreators = require('../actions/StorageActionCreators');
var DiligentStore         = DiligentAgent.store;

var BookshelfContainer = React.createClass({

    getInitialState: function() {
        return {
            disks: []
        };
    },

    componentWillMount: function() {
        DiligentStore.addDiligentListener(this._onDiligentChanges);
        StorageStore.addChangeListener(this._onStorageChange);
        StorageActionCreators.register();
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
        StorageActionCreators.unregister();
        StorageStore.removeChangeListener(this._onStorageChange);
        DiligentStore.removeDiligentListener(this._onDiligentChanges);
    },

    _onStorageChange: function(change) {
        this.setState({ disks: StorageStore.getDisks() });
    },

    _onDiligentChanges: function() {
        switch (DiligentStore.getClient().status) {
            case DiligentConstants.DILIGENT_WSAPI_LOAD_SUCCESS:
                StorageActionCreators.list();
                break;
        }
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
