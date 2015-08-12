var Application = require('framework/AppFramework');
var AppMainView = require('./views/AppMainView.jsx');

// Create a new application
var app = new Application();

// Configure the application
app.configure({ debug: true });

// Render application views
app.render(AppMainView);
