var ShopApp = require('./components/ShopApp.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <ShopApp />,
    document.getElementById('app-view')
);
