FROM node:latest

WORKDIR /app

COPY ./package.json .

RUN npm i nextjs -g

COPY . .

EXPOSE 3000

RUN cd /app/

RUN cd /app/tools/ chmod +x init.sh

ENTRYPOINT [ "sh" , "/app/tools/init.sh" ]
CMD ["npm", "run", "start"]