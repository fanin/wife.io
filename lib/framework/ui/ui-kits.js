var utils = require('../utils');

/* Import jQuery UI library */
utils.include('lib/jquery/ui/1.11.1/themes/smoothness/jquery-ui.min.css');
utils.include('lib/jquery/ui/1.11.1/jquery-ui.min.js');
/* Import UI framework components */
utils.include("lib/framework/ui/bundle.css");

var Dialog = require('dialog/js/dialog');
var NavigationBar = require('navigation-bar/js/navigation-bar');
var Notifier = require('notifier/js/notifier');
var Page = require('page/js/page');
var TableView = require('tableview/js/tableview');
