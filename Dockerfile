# syntax=docker/dockerfile:1

# Build this Dockerfile from the monorepo root:
# docker build -f integrations/telegram/Dockerfile -t botpress-telegram .

ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.29.3

FROM node:${NODE_VERSION}-bullseye-slim AS base

WORKDIR /usr/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json turbo.json ./

# Install pnpm and build dependencies
RUN npm install -g pnpm@${PNPM_VERSION} && echo "PNPM version: ${PNPM_VERSION}"
RUN npm install turbo --global


# `bp add` resolves the `bpDependencies` of the integration from source, so the
# referenced interfaces must be present in the build context
COPY ./packages ./packages
COPY ./integrations ./integrations
COPY ./interfaces /usr/app/interfaces
COPY ./patches ./patches
# install
RUN pnpm install --frozen-lockfile

# generate
RUN turbo run build --filter='!@botpress/vai' --filter='!@botpress/zai'

FROM node:${NODE_VERSION}-bullseye-slim AS telegram

COPY --from=base /usr/app/integrations/telegram/.botpress/dist/index.cjs ./index.cjs
COPY integrations/telegram/server.js ./server.js

# set port env and expose it
ENV PORT=8081
EXPOSE ${PORT}

ENTRYPOINT ["node", "server.js"]

FROM node:${NODE_VERSION}-bullseye-slim AS chat

COPY --from=base /usr/app/integrations/chat/.botpress/dist/index.cjs ./index.cjs
COPY integrations/chat/server.js ./server.js

# set port env and expose it
ENV PORT=8081
EXPOSE ${PORT}

ENTRYPOINT ["node", "server.js"]
