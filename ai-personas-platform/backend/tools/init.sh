#!/bin/bash

sleep 5

npm install && next build
npx prisma migrate dev --name init
npx prisma generate 


sleep 5

# npx ts-node script.ts

npm run start:dev

# tail -f
