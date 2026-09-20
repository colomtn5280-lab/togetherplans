# DateNight API — Cloud Run container
# Multi-stage: build TypeScript, then run a slim production image.

FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npx prisma generate && npm run build && cp -r src/emails dist/emails

FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev && npx prisma generate --no-hints || true
# generated client lives in src/generated; copy the compiled output which includes it
COPY --from=build /app/dist ./dist

EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/main.js"]
