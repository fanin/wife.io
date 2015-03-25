var GreetingsMainView = require('./views/GreetingsMainView.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <GreetingsMainView />,
    document.getElementById('app-view')
);
