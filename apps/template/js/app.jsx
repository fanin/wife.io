var GreetingsApp = require('./components/GreetingsApp.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <GreetingsApp />,
    document.getElementById('app-view')
);
