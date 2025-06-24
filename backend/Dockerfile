
FROM node:22.14-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22.14-alpine AS production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY package.json ./


ENV HOST=0.0.0.0
ENV PORT=3000
ENV CASSANDRA_CONTACT_POINT=
ENV CASSANDRA_PORT=9042
ENV CASSANDRA_KEYSPACE=

ENV ADMIN_USERNAME=

EXPOSE 3000

CMD ["sh", "-c", "npm run start"]