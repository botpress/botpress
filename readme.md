<div align="center">

# Botpress Cloud

[![Discord](https://img.shields.io/badge/Join_Community-white?color=7289da&label=Discord&labelColor=6a7ec1&logo=discord&logoColor=FFF)](https://discord.gg/botpress)
[![YouTube Subscribe](https://img.shields.io/badge/YouTube-red?logo=youtube&logoColor=white)](https://www.youtube.com/c/botpress)
[![Documentation](https://img.shields.io/badge/Documentation-blue?logo=typescript&logoColor=white)](https://docs.botpress.cloud)
[![@botpress/sdk](https://img.shields.io/badge/@botpress%2fsdk-black?logo=npm)](https://www.npmjs.com/package/@botpress/sdk)
[![@botpress/cli](https://img.shields.io/badge/@botpress%2fcli-black?logo=npm)](https://www.npmjs.com/package/@botpress/cli)

[Botpress](https://botpress.com) is the ultimate platform for building **next-generation chatbots** and assistants powered by OpenAI. Start building incredible assistants for your projects or businesses at lightning speed.

[Getting started](#getting-started) •
[Cloud](https://app.botpress.cloud) •
[Documentation](https://botpress.com/docs) •
[Integrations](#integrations) •
[Agents](#agents)

<img src="https://user-images.githubusercontent.com/10071388/248040379-8aee1b03-c483-4040-8ee0-741554310e88.png" width="800">
  
</div>

## Getting started

This repository contains:

- [**Integrations**](#integrations) – all public integrations on the [Botpress Hub](https://app.botpress.cloud/hub)
- [**Agents**](#agents) – all public agents on the [Botpress Studio](https://studio.botpress.cloud) **(coming soon)**
- [**Devtools**](#devtools) – all Botpress Cloud dev tools (CLI, SDK, API Client)

## Integrations

The [`/integrations`](./integrations) folder contains all our public and open-source integrations. We invite the community to contribute their own integrations to Botpress Cloud.

Create integrations using the **Botpress CLI** and submit a pull request to make your mark on the future of chatbots.

### Installation

The Botpress Cloud environment is built using **Typescript** and [**Node.js**](https://nodejs.org).
Make sure you have a recent version of Node (>16) and npm installed.

```sh
npm install -g @botpress/cli # for npm
yarn global add @botpress/cli # for yarn
pnpm i -g @botpress/cli # for pnpm
```

### Usage

```sh
# Login for the first time
bp login

# Interactive command to build a new integration
bp init
```

### Deploying a Private Integration

By default, all integrations are private to the workspace they have been deployed in.

```sh
bp deploy
```

### Making your Integration Public

To submit your integration to the Botpress Hub and make it publicly available to the community, please make a pull request to this repository by following these [Integration Contribution guidelines](./integrations).

## Agents

Coming soon.

## Devtools

| **Package**                                                          | **Description**                                 | **Docs**                                           | **Code**               |
| -------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ---------------------- |
| [`@botpress/cli`](https://www.npmjs.com/package/@botpress/cli)       | Build and deploy private or public integrations | [Docs](https://botpress.com/docs/integration/cli/) | [Code](./packages/cli) |
| [`@botpress/client`](https://www.npmjs.com/package/@botpress/client) | Type-safe client to consume the Botpress APIs   | [Docs]()                                           | [Code]()               |
| [`@botpress/sdk`](https://www.npmjs.com/package/@botpress/sdk)       | Internal package used by to build integrations  | [Docs]()                                           | [Code]()               |

## Before requesting a PR

Before requesting a PR make sure the below is applied.

### package.json

#### name

In your package.json, make sure that the "name" is prefixed by `@botpresshub`.
Example: `"name": "@botpresshub/shopify"`

#### javascript

Before requesting a PR make sure your package.json has the below scripts:

```javascript
  "scripts": {
    "bump": "ts-node -T ./scripts/depsynky bump",
    "type:check": "pnpm -r --stream type:check",
    "format:check": "prettier --check .",
    "format:fix": "prettier --write .",
    "lint:check": "eslint ./ --ext .ts --ext .tsx",
    "lint:fix": "eslint --fix ./ --ext .ts --ext .tsx",
    "dep:check": "ts-node -T ./scripts/depsynky check",
    "dep:fix": "ts-node -T ./scripts/depsynky sync",
    "check": "pnpm dep:check && pnpm format:check && pnpm lint:check && pnpm type:check",
    "test": "pnpm vitest --run",
    "fix": "pnpm dep:fix && pnpm format:fix && pnpm lint:fix"
  }
```

Then make sure to run `pnpm run check` and fix all the errors/warnings before submitting your code for a PR.

## Contributing

We love contributions from the community! We welcome pull requests that provide improvements or bug fixes for the CLI, Client, SDK or Integrations.

Please keep the contributions to integrations and open-source packages. For bugs or features related to the API, Botpress Cloud or the Botpress Studio, please talk to us on [Discord](https://discord.gg/botpress) instead!

## Licensing

All packages in this repository are open-source software and licensed under the [MIT License](LICENSE). By contributing in this repository, you agree to release your code under this license as well.

Let's build the future of chatbot development together! 🤖🚀
