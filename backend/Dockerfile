# DateNight API — Cloud Run container
# Multi-stage: build TypeScript, then run a slim production image.

FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npx prisma generate && npm run build && cp -r src/emails dist/emails && cp -r src/assets dist/assets && cp -r src/services/invite-cards/templates dist/services/invite-cards/templates

FROM node:22-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Chromium + system libs for invite card rendering (puppeteer-core)
# Uses the system Chromium on Debian slim — glibc compatible, works on Cloud Run.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev && npx prisma generate --no-hints || true
# generated client lives in src/generated; copy the compiled output which includes it
COPY --from=build /app/dist ./dist

EXPOSE 8080
ENV PORT=8080
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
