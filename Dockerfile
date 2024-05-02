FROM node:16
WORKDIR /app
COPY web/package.json .
RUN npm install
COPY web/ .