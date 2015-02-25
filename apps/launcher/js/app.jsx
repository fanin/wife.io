var LauncherApp = require('./components/LauncherApp.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <LauncherApp />,
    document.getElementById('app-view')
);
