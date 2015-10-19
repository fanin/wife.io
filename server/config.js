var fs   = require('fs'),
    path = require('path');

const SERVER_SETTINGS_FILE = 'server-settings.json';

function ServerConfig() {
  try {
    if (process.argv.length == 3)
      SERVER_SETTINGS_FILE = process.argv[2];

    var jsonString = fs.readFileSync(path.join(__dirname, SERVER_SETTINGS_FILE));

    this.settings = JSON.parse(jsonString);
  }
  catch (err) {
    console.log('Read ' + SERVER_SETTINGS_FILE + ' error: ' + err.toString());
    process.exit(1);
  }

  /* Configure NODE_PATH at runtime */
  process.env.NODE_PATH = [
    __dirname,
    path.resolve(__dirname, '../sdk/lib/'),
    this.settings.node_path.join(':')
  ].join(':');
  require('module')._initPaths();

  this.settings.root_path = path.dirname(__dirname);

  if (!this.settings.user_data_path)
    throw new Error('Missing system setting "user_data_path" in the settings.json');

  if (!this.settings.temp_data_path)
    this.settings.temp_data_path = '/tmp';

  /* Set process name */
  process.title = this.settings.sys_name;
}

var singleton = function() {
  if (singleton.caller != singleton.getInstance){
    throw new Error("This object cannot be instanciated");
  }
}

singleton.instance = null;

singleton.getInstance = function() {
  if(this.instance === null) {
    this.instance = new ServerConfig();
  }
  return this.instance;
}

module.exports = singleton.getInstance();
