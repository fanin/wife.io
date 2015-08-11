var express      = require('express'),
    https        = require('https'),
    http         = require('http'),
    fs           = require('fs'),
    path         = require('path'),
    favicon      = require('serve-favicon'),
    logger       = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser   = require('body-parser');

var index = require('controllers/index'),
    api   = require('controllers/api'),
    apps  = require('controllers/apps'),
    lib   = require('controllers/lib'),
    pub   = require('controllers/public');

var app = express();

//var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
//var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

//var credentials = { key: privateKey, cert: certificate };

http.createServer(app).listen(8001);
//https.createServer(credentials, app).listen(8443);

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

//var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})

app.use(favicon(path.dirname(__dirname) + '/public/img/favicon.ico'));
app.use(logger('short' /*, {stream: accessLogStream} */));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api', api);
app.use('/apps', apps);
app.use('/lib', lib);
app.use('/public', pub);

app.get('*', function(req, res, next) {
    console.log('Unhandled route URL: ' + req.url);
    next();
});

app.use(function(req, res, next) {
    res.sendStatus(404);
});

module.exports = app;
