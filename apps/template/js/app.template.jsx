var $TEMPLATE$MainView = require('./views/$TEMPLATE$MainView.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <$TEMPLATE$MainView />,
    document.getElementById('app-view')
);
