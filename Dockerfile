FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG VITE_SERVER_URL=""
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
COPY . .
RUN npm ci
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=2567
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci --omit=dev
COPY --from=build /app/apps/server/build ./apps/server/build
COPY --from=build /app/apps/client/dist ./apps/client/dist
EXPOSE 2567
CMD ["node", "apps/server/build/index.js"]
