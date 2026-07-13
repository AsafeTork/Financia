FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npx", "vite", "preview", "--port", "3000", "--host", "0.0.0.0"]