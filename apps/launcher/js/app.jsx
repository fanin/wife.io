var LauncherMainView = require('./views/LauncherMainView.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <LauncherMainView />,
    document.getElementById('app-view')
);
