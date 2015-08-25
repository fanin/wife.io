
var express    = require('express'),
    path       = require('path'),
    fs         = require('fs-extra'),
    uploader   = require('routes/helper/upload'),
    permission = require('lib/security/permission'),
    appmgr     = require('lib/app/app-manager');

var router = express.Router();
