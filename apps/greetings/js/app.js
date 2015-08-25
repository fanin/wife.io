import Application from 'framework/AppFramework';
import AppMainView from './views/AppMainView.jsx';

// Create a new application
var app = new Application();

// Configure the application
app.configure({ debug: true });

// Render application views
app.render(AppMainView);
