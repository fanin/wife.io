var express      = require('express'),
    session      = require('express-session'),
    https        = require('https'),
    http         = require('http'),
    fs           = require('fs'),
    path         = require('path'),
    favicon      = require('serve-favicon'),
    logger       = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser   = require('body-parser'),
    passport     = require('passport'),
    assert       = require('assert');

var index   = require('routes/index'),
    user    = require('routes/user'),
    api     = require('routes/api'),
    apps    = require('routes/apps'),
    sdk     = require('routes/sdk');

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

app.use(favicon(path.join(path.dirname(__dirname), 'public/img/favicon.ico')));
app.use(logger('short' /*, {stream: accessLogStream} */));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'wife secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(path.dirname(__dirname), 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use('/user', user);
app.use('/', index);
app.use('/apps', apps);
app.use('/sdk', sdk);
app.use('/api', api);

app.get('*', function(req, res, next) {
  console.log('Unhandled route URL: ' + req.url);
  next();
});

app.use(function(req, res, next) {
  res.sendStatus(404);
});

module.exports = app;
