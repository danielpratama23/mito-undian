FROM node:20-alpine AS base
WORKDIR /app

# Install deps
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Builder - generate Prisma client
FROM deps AS builder
RUN npm install prisma --save-dev
COPY prisma ./prisma
RUN npx prisma generate

# Final image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY src ./src
COPY prisma ./prisma

EXPOSE 3001
CMD ["node", "src/app.js"]
