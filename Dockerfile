FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY ./src ./src
COPY tsconfig.json ./

RUN npm run build

RUN npm ci --omit=dev && npm cache clean --force

EXPOSE $PORT

CMD ["npm", "start"]
