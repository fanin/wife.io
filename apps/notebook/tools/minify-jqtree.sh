#!/bin/bash

./node_modules/.bin/uglifycss ./lib/jqTree/jqtree.css > ./lib/jqTree/jqtree.min.css
./node_modules/.bin/uglifyjs ./lib/jqTree/tree.jquery.js > ./lib/jqTree/tree.jquery.min.js
