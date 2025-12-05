# syntax=docker/dockerfile:1

# Build this Dockerfile from the monorepo root:
# docker build -f integrations/chat/Dockerfile -t botpress-chat .

ARG NODE_VERSION=22.17.0
ARG PNPM_VERSION=10.12.4

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

################################################################################
# Create a stage for installing production dependencies.
FROM base AS deps

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy patches directory if it exists (required for pnpm patches)
COPY patches ./patches

# Copy all workspace sources (we'll rely on .dockerignore to exclude node_modules and build artifacts)
COPY packages ./packages
COPY integrations ./integrations
COPY interfaces ./interfaces
COPY plugins ./plugins

# Install production dependencies for the chat integration and its dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm --filter @botpresshub/chat... install --frozen-lockfile --prod

################################################################################
# Create a stage for building the application.
FROM base AS build

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

# Copy patches directory if it exists (required for pnpm patches)
COPY patches ./patches

# Copy all workspace sources
COPY packages ./packages
COPY integrations ./integrations
COPY interfaces ./interfaces
COPY plugins ./plugins

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install all dependencies (including dev dependencies) for building
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm --filter @botpresshub/chat... install --frozen-lockfile

# Rebuild native modules for Alpine Linux ARM64
RUN cd node_modules/.pnpm/@parcel+watcher@2.1.0/node_modules/@parcel/watcher && \
    npm run install && \
    cd /usr/src/app || true

# Build the CLI package (needed for chat integration build)
# Skip if already built, otherwise build without dependencies to avoid full monorepo build
RUN if [ ! -f packages/cli/dist/cli.js ]; then \
      echo "Building CLI..." && \
      cd packages/cli && \
      pnpm run bundle || echo "Bundle failed, trying full build..." && \
      pnpm run build || echo "Warning: CLI build failed"; \
    fi

# Build the chat integration
RUN pnpm --filter @botpresshub/chat run build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
FROM base AS final

# Use production node environment by default.
ENV NODE_ENV=production

# Run the application as a non-root user.
USER node

# Copy workspace configuration
COPY --chown=node:node package.json pnpm-workspace.yaml ./

# Copy production dependencies from deps stage
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=deps /usr/src/app/packages ./packages

# Copy the chat integration package.json and built output
COPY --chown=node:node --from=build /usr/src/app/integrations/chat/package.json ./integrations/chat/
COPY --chown=node:node --from=build /usr/src/app/integrations/chat/.botpress ./integrations/chat/.botpress

# Set working directory to the integration
WORKDIR /usr/src/app/integrations/chat

# Expose the port that the application listens on.
EXPOSE 8072

# Run the application.
CMD ["pnpm", "bp", "serve"]
