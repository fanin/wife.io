var NotebookMainView = require('./views/NotebookMainView.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <NotebookMainView />,
    document.getElementById('app-view')
);
