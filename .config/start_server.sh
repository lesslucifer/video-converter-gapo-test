#! /bin/bash

cd /var/www/server/

rm -rf dist
yarn install
yarn build
yarn serve
