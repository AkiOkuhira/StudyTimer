FROM node:16-alpine3.18

WORKDIR /app

COPY ./package.json ./package-lock.json .

RUN npm install

EXPOSE 8999
CMD [ "node", "src/index.js" ]