FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production=false
COPY frontend . 
ARG VITE_API_URL
ARG VITE_WEBHOOK_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBHOOK_URL=$VITE_WEBHOOK_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]