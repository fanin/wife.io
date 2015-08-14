#!/usr/bin/env node

var _ = require('underscore');
var path = require('path');
var fs = require('fs-extra');
var mime = require('mime');
var assign = require("object-assign");
var readdirSync = require('recursive-readdir-sync');
var randomstring = require('../lib/utils/common/string-misc').randomString;
var argv = require('minimist')(process.argv.slice(2));

function usage() {
    console.log("Usage:");
    console.log("wife-app-creator.js -n {APP_NAME} -v {APP_VERSION} -a {API_VERSION} -t {APP_TYPE} -d {APP_DESC} OUTPUT_PATH");
    console.log("wife-app-creator.js -f {APP_CONF_FILE} OUTPUT_PATH");
    console.log("where:");
    console.log("   APP_NAME:      App name (Ex: 'Hello World')");
    console.log("   APP_VERSION:   App version in string (Ex: '1.0.0')");
    console.log("   API_VERSION:   API version number (Ex: 1)");
    console.log("   APP_TYPE:      App type ('Internal', 'User' or 'Certified')");
    console.log("   APP_DESC:      App description");
    console.log("   APP_CONF_FILE: App configuration file in JSON format (See 'sdk/bin/examples/hello_app.json' for example)");
    console.log("   OUTPUT_PATH:   App files output path");
}

var appConfig = {
    name: 'Hello World',
    version: '0.0.1',
    api_version: 1,
    identifier: '',
    description: '',
    repository: '',
    permissions: {
        apps: {
            POST: "denied",
            GET: "denied",
            PUT: "denied",
            DELETE: "denied"
        },
        storage: {
            POST: "denied",
            GET: "denied",
            PUT: "denied",
            DELETE: "denied"
        },
        fs: {
            POST: "allow",
            GET: "allow",
            PUT: "allow",
            DELETE: "allow"
        }
    },
    locales: [ 'en_US' ],
    default_locale: 'en_US',
    author: '',
    license: 'MIT'
};

if (argv._.length === 0) {
    console.log('Output path not specified');
    usage();
    process.exit(1);
}

if (!fs.existsSync(argv._[0])) {
    console.log('Output path do not exist');
    process.exit(1);
}

if (argv.f) {
    try {
        assign(appConfig, fs.readJsonSync(argv.f));
    }
    catch (error) {
        console.log('Read app configuration file failed', 'Error: ' + error);
        process.exit(1);
    }
}

appConfig.name = argv.n || appConfig.name;
appConfig.package_name = appConfig.name.replace(' ', '-').toLowerCase();
appConfig.description = argv.d || appConfig.description;
appConfig.version = argv.v || appConfig.version;
appConfig.api_version = argv.a || appConfig.api_version;
appConfig.sdk_path = path.resolve(__dirname, '..');

var appType = 'UA';

if (argv.t === 'Internal')
    appType = 'IA';
else if (argv.t === 'User')
    appType = 'UA';
else if (argv.t === 'Certified')
    appType = 'CA';

appConfig.identifier = randomstring(appType + 'XXXXXXXX');

process.env.NODE_PATH = path.resolve(__dirname, '..');

var templatePath = path.join(appConfig.sdk_path, 'v' + appConfig.api_version, '/framework/AppFramework/template');
var appDirectory = path.join(argv._[0], appConfig.package_name);

console.log('Create application `' + appConfig.name + '`:');

console.log('  Install SDK: Version ' + appConfig.api_version);
fs.mkdirpSync(path.join(appDirectory, 'sdk'));
fs.copySync(
    path.join(appConfig.sdk_path, 'lib'),
    path.join(appDirectory, '/sdk/lib'),
    { clobber: true, preserveTimestamps: false }
);
fs.copySync(
    path.join(appConfig.sdk_path, 'v' + appConfig.api_version),
    path.join(appDirectory, 'sdk', 'v' + appConfig.api_version),
    { clobber: true, preserveTimestamps: false }
);

// Set to local SDK path
appConfig.sdk_path = 'sdk';

readdirSync(templatePath).forEach(function(file) {
    var filetype = mime.lookup(file);
    var outfile = file.replace(templatePath, appDirectory);

    console.log('  Generate ' + outfile);

    fs.mkdirpSync(path.dirname(outfile));

    if (
        filetype.indexOf('text') >= 0 ||
        filetype.indexOf('json') >= 0 ||
        filetype.indexOf('javascript') >= 0
    ) {
        var data = fs.readFileSync(file, 'ascii');
        var template = _.template(data);
        fs.writeFileSync(outfile, template(appConfig), 'ascii');
    }
    else {
        fs.copySync(file, outfile, { clobber: true, preserveTimestamps: false });
    }
});

console.log('Your application is created at `' + appDirectory + '`.');
