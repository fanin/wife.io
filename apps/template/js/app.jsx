var AppMainView = require('./views/AppMainView.jsx');
var Menubar     = require('framework/cutie/Menubar/js/Menubar.jsx');
var Sidebar     = require('framework/cutie/Sidebar/js/Sidebar.jsx');
var DebugView   = require('framework/cutie/DebugView/js/DebugView.jsx');

React.render(
    <Menubar />,
    document.getElementById('diligent-menubar')
);

React.render(
    <Sidebar debug={true} />,
    document.getElementById('diligent-sidebar')
);

React.render(
    <DebugView />,
    document.getElementById('diligent-debug-view')
);

React.render(
    <AppMainView />,
    document.getElementById('app-view')
);
