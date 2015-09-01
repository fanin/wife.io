var ShopSectionMyApp = require('./ShopSectionMyApp.jsx');

var AppMainView = React.createClass({
  render: function() {
    return (
      <div className="shop-section">
        <ShopSectionMyApp />
      </div>
    );
  }
});

module.exports = AppMainView;
