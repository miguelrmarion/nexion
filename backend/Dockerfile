# Production deps
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Build deps
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Runtime
FROM node:22-slim

RUN apt-get update && apt-get install -y \
     python3 \
     python3-venv \
     python3-pip \
     libgomp1 \
     && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /venv \
     && /venv/bin/pip install --no-cache-dir \
     --index-url https://download.pytorch.org/whl/cpu torch \
     && /venv/bin/pip install --no-cache-dir numpy sentence-transformers

ENV PATH="/venv/bin:$PATH"
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/topic-matching ./src/topic-matching

RUN mkdir -p /data

ARG PORT=3001
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["sh", "-c", "npx prisma db push && node dist/main"]
