# syntax=docker/dockerfile:1

# Build this Dockerfile from the monorepo root:
# docker build -f integrations/chat/Dockerfile -t botpress-chat .

# Run with this command:
# docker run -it -e SECRET_SIGNAL_URL=https://chat.botpress.dev botpress-chat

ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.12.4

FROM node:${NODE_VERSION}-bullseye-slim AS base

WORKDIR /usr/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm and build dependencies
RUN npm install -g pnpm@${PNPM_VERSION} && echo "PNPM version: ${PNPM_VERSION}"

# copy package dependencies
COPY ./packages /usr/app/packages
COPY ./tsconfig.json /usr/app/tsconfig.json
COPY integrations/chat ./integrations/chat
COPY patches/source-map-js@1.2.1.patch patches/source-map-js@1.2.1.patch

# Use NODE_ENV to avoid installing devDependencies
ENV NODE_ENV=production

# install
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bpinternal/zui run build
RUN pnpm --filter @botpress/chat run build
RUN pnpm --filter @botpress/client run build
RUN pnpm --filter @botpress/sdk run build
RUN pnpm --filter @botpress/cognitive run build
RUN pnpm --filter @botpress/cli run bundle
RUN pnpm --filter @botpresshub/chat run build

# Produce a self-contained node_modules with no pnpm symlinks.
# Only includes production dependencies of the chat integration (including OTel).
RUN pnpm --filter @botpresshub/chat --prod deploy --legacy /tmp/chat-deploy


FROM node:${NODE_VERSION}-bullseye-slim AS deploy

COPY --from=base /usr/app/integrations/chat/.botpress/dist/index.cjs ./index.cjs
RUN echo "const server = require('./index.cjs')\nconst port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8081\nserver.default.start(port)" > server.js

# Copy OTel packages from the pnpm deploy output (real files, no symlinks).
# These are loaded via dynamic require() in the SDK's tracing module and must
# be present in node_modules (not bundled by esbuild) for monkey-patching to work.
COPY --from=base /tmp/chat-deploy/node_modules/@opentelemetry ./node_modules/@opentelemetry

# set port env and expose it
ENV PORT=8081
ENV TRACING_ENABLED=true
ENV OTEL_SERVICE_NAME="chat-integration"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://127.0.0.1:4318"
EXPOSE ${PORT}

ENTRYPOINT ["node", "server.js"]
