FROM node:18-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
COPY . .
RUN npm install
RUN npm run build
RUN npm cache clean --force
ENV NODE_ENV="production"
ENV APP_ID=$APP_ID
ENV PRIVATE_KEY=$PRIVATE_KEY
CMD [ "npm", "start" ]
