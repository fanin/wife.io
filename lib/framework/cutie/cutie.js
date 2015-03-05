var utils = require('../diligent/utils/utils');

/* Import jQuery UI library */
utils.include('lib/jquery/plugins/gritter/css/jquery.gritter.css');
utils.include('lib/jquery/plugins/gritter/js/jquery.gritter.min.js');

/* Cutie UI Controllers */
NotificationController = require('./notification/js/components/NotificationController');

/* Cutie UI Views */
AlertView = require('./alert/js/components/AlertView.jsx');
