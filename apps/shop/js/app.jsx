var ShopMainView = require('./views/ShopMainView.jsx');

DiligentAgent.render({ debug: true });

React.render(
    <ShopMainView />,
    document.getElementById('app-view')
);
