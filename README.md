#wife.io

`Wife.io` is an extensible web control system designed for devices which are capable of running node.js.

###Architecture

Backend:   System service provider based on node.js

![Backend Architecture](docs/diligent_be.png =600x)

Frontend: Client applications built with React/Flux architecture

![Frontend Architecture](docs/diligent_fe.png =600x)

![App Framework](docs/app_framework.png =600x)

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
