FROM node:alpine

WORKDIR /app

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

# Dependencies optimization
COPY package.json ./
RUN yarn install

COPY . .

EXPOSE 4242
CMD [ "node", "src/index.js" ]
