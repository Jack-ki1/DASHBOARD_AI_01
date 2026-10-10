# ---- dashboard-ai (multi-stage: build frontend, run backend serving it)
FROM node:24-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm i --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM node:24-slim AS server
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm i --omit=dev --no-audit --no-fund
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
ENV PORT=4000 FRONTEND_DIST=/app/frontend/dist DATABASE_PATH=/data/app.db
EXPOSE 4000
VOLUME ["/data"]
CMD ["node", "src/index.js"]
