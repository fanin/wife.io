var utils = require('../diligent/utils/utils');

/* Import jQuery UI library */
utils.include('lib/jquery/plugins/gritter/css/jquery.gritter.css');
utils.include('lib/jquery/plugins/gritter/js/jquery.gritter.min.js');

/* Cutie UI Controllers */
NotificationController = require('./controllers/Notification/js/NotificationController');
AlertViewController = require('./controllers/AlertView/js/AlertViewController.jsx');
