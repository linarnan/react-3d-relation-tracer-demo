#!/bin/bash
webpack $@

cp -f src/index.html views/index.html
cp -f dist/js/app.js static/js/app.js
