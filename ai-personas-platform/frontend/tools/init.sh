#!/bin/bash

npm i
sleep 5
npm run build
sleep 5
exec "$@"