FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy monorepo root settings
COPY package.json ./
COPY packages/types ./packages/types
COPY apps/backend ./apps/backend

# Install dependencies (workspaces supported automatically)
RUN npm install

# Build backend and prisma
WORKDIR /usr/src/app/apps/backend
RUN npx prisma generate
RUN npm run build

# Run Stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages/types ./packages/types
COPY --from=builder /usr/src/app/apps/backend ./apps/backend

WORKDIR /usr/src/app/apps/backend

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
