#!/bin/bash

npm install -g grunt-cli
if [ "$TRAVIS_SECURE_ENV_VARS" = "false" ]; then
   npm install selenium-server
   node node_modules/selenium-server/bin/selenium &
fi