FROM node:24-alpine
WORKDIR /app
ARG NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "index.js"]