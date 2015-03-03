'use strict';

var DiligentNavigationBar  = require('./DiligentNavigationBar.jsx');
var DiligentDock           = require('./DiligentDock.jsx');
var DiligentConsole        = require('./DiligentConsole.jsx');
var DiligentDispatcher     = require('../dispatcher/DiligentDispatcher');
var DiligentActionCreators = require('../actions/DiligentActionCreators');
var DiligentStore          = require('../stores/DiligentStore');

var DiligentAgent = {
    actions: DiligentActionCreators,
    store: DiligentStore,
    render: function(opts) {
        React.render(
            <DiligentNavigationBar debug={opts ? opts.debug : false} />,
            document.getElementById('diligent-navigation-bar')
        );

        React.render(
            <DiligentDock />,
            document.getElementById('diligent-dock')
        );

        React.render(
            <DiligentConsole />,
            document.getElementById('diligent-console')
        );
    }
};

module.exports = DiligentAgent;
