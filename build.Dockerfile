FROM node:8

WORKDIR /usr/app

COPY package.json .
RUN npm i --quiet

COPY . .
