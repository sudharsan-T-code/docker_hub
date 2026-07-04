FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY packages/types ./packages/types
COPY apps/frontend ./apps/frontend

RUN npm install

WORKDIR /usr/src/app/apps/frontend
# Build nextjs
RUN npm run build

# Run Stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages/types ./packages/types
COPY --from=builder /usr/src/app/apps/frontend ./apps/frontend

WORKDIR /usr/src/app/apps/frontend

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
