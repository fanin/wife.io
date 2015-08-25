import { include } from 'lib/utils/apiutil';
import Application from 'framework/AppFramework';
import AppMainView from './views/AppMainView.jsx';

Promise.all([
  include('lib/jqTree/tree.jquery.min.js'),
  include('lib/ckeditor/ckeditor.js'),
  include('lib/html2canvas/html2canvas.min.js'),
  include('lib/jqTree/jqtree.min.css')
]).then(function() {
  // Create a new application
  var app = new Application();

  // Configure the application
  app.configure({ debug: true });

  // Render application views
  app.render(AppMainView);
});
