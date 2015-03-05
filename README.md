#wife.io

Wife.io, a Web Interface For Embedded devices, is a prior project to WifeOS based on node.js.

###Prepare
```
$ npm install
$ source envsetup.sh
```

###Build your wife
```
$ gulp
```
This will build and install your wife to `mywife/` folder.
```
$ gulp clean
```
Remove `mywife/` folder.


###Gulp build targets
```
server   : diligent server runs on node.js
lib      : 3rd-party libraries (jquery, react, semantic-ui...etc)
diligent : diligent client framework
cutie    : cutie ui framework
app      : builtin apps
api      : socket.io api spec
resource : copy resource files
config   : system configuration files
```

###Build individual apps
```
$ cd app/yourapp
$ gulp
$ gulp clean
```
