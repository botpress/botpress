import type { DefinitionTree } from './command-tree'
import * as config from './config'

export default {
  login: { description: 'Login to Botpress Cloud', schema: config.schemas.login },
  logout: { description: 'Logout of Botpress Cloud', schema: config.schemas.logout },
  bots: {
    description: 'Bot related commands',
    subcommands: {
      create: { description: 'Create new bot', schema: config.schemas.createBot, alias: 'new' },
      get: { description: 'Get bot', schema: config.schemas.getBot },
      delete: { description: 'Delete bot', schema: config.schemas.deleteBot, alias: 'rm' },
      list: { description: 'List bots', schema: config.schemas.listBots, alias: 'ls' },
    },
  },
  integrations: {
    description: 'Integration related commands',
    subcommands: {
      get: { description: 'Get integration', schema: config.schemas.getIntegration },
      delete: { description: 'Delete integration', schema: config.schemas.deleteIntegration, alias: 'rm' },
      list: { description: 'List integrations', schema: config.schemas.listIntegrations, alias: 'ls' },
    },
  },
  interfaces: {
    description: 'Interface related commands',
    subcommands: {
      get: { description: 'Get interface', schema: config.schemas.getInterface },
      delete: { description: 'Delete interface', schema: config.schemas.deleteInterface, alias: 'rm' },
      list: { description: 'List interfaces', schema: config.schemas.listInterfaces, alias: 'ls' },
    },
  },
  plugins: {
    description: 'Plugin related commands',
    subcommands: {
      get: { description: 'Get plugin', schema: config.schemas.getPlugin },
      delete: { description: 'Delete plugin', schema: config.schemas.deletePlugin, alias: 'rm' },
      list: { description: 'List plugins', schema: config.schemas.listPlugins, alias: 'ls' },
    },
  },
  init: { description: 'Initialize a new project', schema: config.schemas.init },
  generate: { description: 'Generate typings for intellisense', schema: config.schemas.generate, alias: 'gen' },
  bundle: { description: 'Bundle a botpress project', schema: config.schemas.bundle },
  build: { description: 'Generate typings and bundle a botpress project', schema: config.schemas.build },
  read: { description: 'Read and parse an integration definition', schema: config.schemas.read },
  serve: { description: 'Serve your project locally', schema: config.schemas.serve },
  deploy: { description: 'Deploy your project to the cloud', schema: config.schemas.deploy },
  add: { description: 'Install a package; could be an integration or an interface', schema: config.schemas.add },
  dev: { description: 'Run your project in dev mode', schema: config.schemas.dev },
  lint: { description: 'EXPERIMENTAL: Lint an integration definition', schema: config.schemas.lint },
  chat: { description: 'EXPERIMENTAL: Chat with a bot directly from the CLI', schema: config.schemas.chat },
} satisfies DefinitionTree
