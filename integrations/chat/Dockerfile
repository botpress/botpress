# syntax=docker/dockerfile:1

# Build this Dockerfile from the monorepo root:
# docker build -f integrations/chat/Dockerfile -t botpress-chat .

ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.12.4

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-bullseye-slim AS base

WORKDIR /usr/app

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

RUN npm install --save-dev typescript

RUN npm install --save-dev ts-node

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ./packages /usr/app/packages
COPY ./tsconfig.json /usr/app/tsconfig.json


COPY integrations/chat ./chat

COPY patches/source-map-js@1.2.1.patch patches/source-map-js@1.2.1.patch

# TODO make a new stage


# Install build tools, install all deps (build native addons), rebuild from source, then remove build tools
RUN pnpm install --frozen-lockfile

# Use production node environment by default.
ENV NODE_ENV=production

RUN echo -e "const server = require('./chat/.botpress/dist/index.cjs')\nserver.default.start()" > server.js

RUN pnpm --filter @botpress/cli run bundle


RUN node ./packages/cli/dist/cli.js build --workDir ./chat

WORKDIR /usr/app

CMD ["node", "./packages/cli/dist/cli.js", "serve"]
