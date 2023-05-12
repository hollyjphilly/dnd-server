FROM node:19

WORKDIR /index

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "index.mjs" ]