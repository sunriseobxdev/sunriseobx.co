FROM node:22-alpine AS ts-sdk-builder
WORKDIR /app/ts-sdk
COPY ts-sdk/package.json ts-sdk/package-lock.json* ts-sdk/tsconfig.json ./
COPY ts-sdk/src/ ./src/
RUN npm install && npm run build

FROM node:22-alpine AS deps
WORKDIR /app
COPY --from=ts-sdk-builder /app/ts-sdk ./ts-sdk/
COPY services/api/package.json services/api/package-lock.json* ./services/api/
RUN cd services/api && npm install

FROM node:22-alpine AS builder
WORKDIR /app/services/api
COPY --from=deps /app/ts-sdk /app/ts-sdk
COPY --from=deps /app/services/api/node_modules ./node_modules
COPY services/api/ .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/services/api
ENV NODE_ENV=production
COPY --from=ts-sdk-builder /app/ts-sdk /app/ts-sdk/
COPY --from=builder /app/services/api/dist ./dist
COPY --from=builder /app/services/api/node_modules ./node_modules
COPY --from=builder /app/services/api/package.json ./
COPY --from=builder /app/services/api/assets ./assets
EXPOSE 8080
CMD ["node", "dist/index.js"]
