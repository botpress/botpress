# syntax=docker/dockerfile:1

# Build this Dockerfile from the monorepo root:
# docker build -f integrations/telegram/Dockerfile -t botpress-telegram .

ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.29.3

FROM node:${NODE_VERSION}-bullseye-slim AS base

WORKDIR /usr/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm and build dependencies
RUN npm install -g pnpm@${PNPM_VERSION} && echo "PNPM version: ${PNPM_VERSION}"

# copy package dependencies
COPY ./packages /usr/app/packages
COPY ./tsconfig.json /usr/app/tsconfig.json
# `bp add` resolves the `bpDependencies` of the integration from source, so the
# referenced interfaces must be present in the build context
COPY ./interfaces /usr/app/interfaces
COPY integrations/telegram ./integrations/telegram
COPY patches/source-map-js@1.2.1.patch patches/source-map-js@1.2.1.patch
# install
RUN pnpm install --frozen-lockfile

# generate
RUN pnpm --filter @botpress/client run generate
RUN pnpm --filter @botpress/chat run generate

# build
RUN pnpm --filter @bpinternal/zui run build
RUN pnpm --filter @botpress/chat run build
RUN pnpm --filter @botpress/client run build
RUN pnpm --filter @botpress/sdk run build
RUN pnpm --filter @botpress/cognitive run build
RUN pnpm --filter @botpress/cli run bundle
RUN pnpm --filter @botpresshub/telegram run build

FROM node:${NODE_VERSION}-bullseye-slim AS deploy

COPY --from=base /usr/app/integrations/telegram/.botpress/dist/index.cjs ./index.cjs
COPY integrations/telegram/server.js ./server.js

# set port env and expose it
ENV PORT=8081
EXPOSE ${PORT}

ENTRYPOINT ["node", "server.js"]
