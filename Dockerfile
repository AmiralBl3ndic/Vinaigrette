FROM node:latest

WORKDIR /app

# Dependencies optimization
COPY package.json ./
RUN yarn install

COPY . .

EXPOSE 4242
CMD [ "node", "src/index.js" ]
