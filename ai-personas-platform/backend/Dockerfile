FROM node:latest

WORKDIR /app

COPY ./package.json ./
RUN npm cache clean --force
RUN npm install -g prisma

COPY . .
EXPOSE 7777
RUN cd /app/tools/  chmod +x init.sh

ENTRYPOINT [ "sh", "/app/tools/init.sh" ]
CMD [ "" ]