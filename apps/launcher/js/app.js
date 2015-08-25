import { include } from 'lib/utils/apiutil';
import Application from 'framework/AppFramework';
import AppMainView from './views/AppMainView.jsx';

include('/sdk/lib/jquery/ui/1.11.1/jquery-ui.min.js').then(function() {
  // Create a new application
  var app = new Application();

  // Configure the application
  app.configure({ debug: true });

  // Render application views
  app.render(AppMainView);
});
