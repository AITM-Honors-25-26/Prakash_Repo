FROM node:22-alpine

WORKDIR /app

RUN npm install -g nodemon

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 9005

CMD ["npm", "run", "watch"]