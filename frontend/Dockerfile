FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY . .

ARG VITE_API_URL
ARG VITE_WEBHOOK_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBHOOK_URL=$VITE_WEBHOOK_URL

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["serve", "-s", "dist", "-l", "3001"]