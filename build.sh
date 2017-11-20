#!/bin/bash
webpack $@

cp -f src/index.html views/index.html
