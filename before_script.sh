#!/bin/bash

if [ "$TRAVIS_SECURE_ENV_VARS" = "false" ]; then
   node node_modules/selenium-server/bin/selenium &
fi