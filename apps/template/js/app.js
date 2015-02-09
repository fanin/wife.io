var React = require('react');
var DiligentAgent = require('./components/DiligentAgent.jsx');
var GreetingsApp = require('./components/GreetingsApp.jsx');

React.render(
    <DiligentAgent debug={true} />,
    document.getElementsByClassName('diligent-console')[0]
);

React.render(
    <GreetingsApp />,
    document.getElementsByClassName('app-view')[0]
);
