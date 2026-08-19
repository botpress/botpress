# syntax=docker/dockerfile:1

# Build this Dockerfile from the monorepo root:
# docker build -f Dockerfile -t botpress-chat --target chat .

ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.29.3

FROM node:${NODE_VERSION}-bullseye-slim AS build

WORKDIR /usr/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json turbo.json .npmrc ./

# Install pnpm and build dependencies
RUN npm install -g pnpm@${PNPM_VERSION} && echo "PNPM version: ${PNPM_VERSION}"

# `bp add` resolves the `bpDependencies` of the integration from source, so the
# referenced interfaces must be present in the build context
COPY ./packages ./packages
COPY ./integrations ./integrations
COPY ./interfaces /usr/app/interfaces
COPY ./patches ./patches
# install
RUN pnpm install --frozen-lockfile

# generate
RUN pnpm build --filter='!@botpress/vai' --filter='!@botpress/zai' --filter='!llmz'

FROM node:${NODE_VERSION}-bullseye-slim AS base

ENV PORT=8081
EXPOSE ${PORT}

COPY integrations/build-utils/server.js ./server.js

ENTRYPOINT ["node", "server.js"]

FROM base AS chat

COPY --from=build /usr/app/integrations/chat/.botpress/dist/index.cjs ./index.cjs
COPY integrations/chat/server.js ./server.js


FROM base AS telegram

COPY --from=build /usr/app/integrations/telegram/.botpress/dist/index.cjs ./index.cjs

