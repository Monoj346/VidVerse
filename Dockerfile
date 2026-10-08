FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN apk add --no-cache ffmpeg \
    && npm ci --omit=dev

COPY src ./src
COPY public ./public

RUN mkdir -p /app/public/temp \
    && chown -R node:node /app/public/temp

USER node

EXPOSE 8000

CMD ["node", "src/index.js"]