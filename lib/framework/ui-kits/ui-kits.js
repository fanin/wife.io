var utils = require('../utils');

/* Import jQuery UI library */
utils.include('lib/jquery/ui/1.11.1/themes/smoothness/jquery-ui.min.css');
utils.include('lib/jquery/ui/1.11.1/jquery-ui.min.js');
/* Import UI framework components */
utils.include("lib/framework/ui/bundle.css");

var NotificationController = require('controllers/notification/js/notification-controller');
var TableViewController = require('controllers/tableview/js/tableview-controller');
