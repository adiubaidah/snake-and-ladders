FROM node:22-alpine AS builder

ARG VITE_SERVER_URL

WORKDIR /app
COPY package*.json ./
RUN npm install --frozen-lockfile
COPY . .

RUN echo "VITE_SERVER_URL=${VITE_SERVER_URL}" > .env.production

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["sh", "-c", "npm run preview -- --port 3000 --host"]