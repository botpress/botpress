# syntax=docker/dockerfile:1

# Build this Dockerfile from the monorepo root:
# docker build -f integrations/chat/Dockerfile -t botpress-chat .

# Run with this command:
# docker run -it -e SECRET_SIGNAL_URL=https://chat.botpress.dev botpress-chat

ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.12.4

FROM node:${NODE_VERSION}-bullseye-slim AS base

WORKDIR /usr/app

# Install pnpm and build dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}
RUN npm install --save-dev typescript
RUN npm install --save-dev ts-node

# copy package dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ./packages /usr/app/packages
COPY ./tsconfig.json /usr/app/tsconfig.json
COPY integrations/chat ./integrations/chat
COPY patches/source-map-js@1.2.1.patch patches/source-map-js@1.2.1.patch

# install
RUN pnpm install --frozen-lockfile
RUN pnpm install --frozen-lockfile --dir integrations/chat

# Use production node environment by default
ENV NODE_ENV=production

# build CLI and use it to build chat integration
RUN pnpm --filter @botpress/cli run bundle
RUN node ./packages/cli/dist/cli.js build --workDir ./integrations/chat

FROM node:${NODE_VERSION}-bullseye-slim AS deploy

COPY --from=base usr/app/integrations/chat/.botpress/dist/index.cjs ./index.cjs
RUN echo "const server = require('./index.cjs')\nserver.default.start()" > server.js

ENTRYPOINT ["node", "server.js"]
