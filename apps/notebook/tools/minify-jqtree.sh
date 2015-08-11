#!/bin/bash

./node_modules/gulp-minify-css/node_modules/.bin/cleancss ./lib/jqTree/jqtree.css > ./lib/jqTree/jqtree.min.css
./node_modules/gulp-uglify/node_modules/.bin/uglifyjs ./lib/jqTree/tree.jquery.js > ./lib/jqTree/tree.jquery.min.js
