import type { DefinitionTree } from './command-tree'
import * as config from './config'
import { t } from './locales'

export default {
  login: { description: t.commands.login.description, schema: config.schemas.login },
  logout: { description: t.commands.logout.description, schema: config.schemas.logout },
  bots: {
    description: t.commands.bots.description,
    subcommands: {
      create: { description: t.commands.bots.create, schema: config.schemas.createBot, alias: 'new' },
      get: { description: t.commands.bots.get, schema: config.schemas.getBot },
      delete: { description: t.commands.bots.delete, schema: config.schemas.deleteBot, alias: 'rm' },
      list: { description: t.commands.bots.list, schema: config.schemas.listBots, alias: 'ls' },
    },
  },
  integrations: {
    description: t.commands.integrations.description,
    subcommands: {
      get: { description: t.commands.integrations.get, schema: config.schemas.getIntegration },
      delete: { description: t.commands.integrations.delete, schema: config.schemas.deleteIntegration, alias: 'rm' },
      list: { description: t.commands.integrations.list, schema: config.schemas.listIntegrations, alias: 'ls' },
    },
  },
  interfaces: {
    description: t.commands.interfaces.description,
    subcommands: {
      get: { description: t.commands.interfaces.get, schema: config.schemas.getInterface },
      delete: { description: t.commands.interfaces.delete, schema: config.schemas.deleteInterface, alias: 'rm' },
      list: { description: t.commands.interfaces.list, schema: config.schemas.listInterfaces, alias: 'ls' },
    },
  },
  plugins: {
    description: t.commands.plugins.description,
    subcommands: {
      get: { description: t.commands.plugins.get, schema: config.schemas.getPlugin },
      delete: { description: t.commands.plugins.delete, schema: config.schemas.deletePlugin, alias: 'rm' },
      list: { description: t.commands.plugins.list, schema: config.schemas.listPlugins, alias: 'ls' },
    },
  },
  init: { description: t.commands.init, schema: config.schemas.init },
  generate: { description: t.commands.generate, schema: config.schemas.generate, alias: 'gen' },
  bundle: { description: t.commands.bundle, schema: config.schemas.bundle },
  build: { description: t.commands.build, schema: config.schemas.build },
  read: { description: t.commands.read, schema: config.schemas.read },
  serve: { description: t.commands.serve, schema: config.schemas.serve },
  deploy: { description: t.commands.deploy, schema: config.schemas.deploy },
  add: {
    description: t.commands.add,
    schema: config.schemas.add,
    alias: ['i', 'install'],
  },
  remove: {
    description: t.commands.remove,
    schema: config.schemas.remove,
    alias: 'rm',
  },
  dev: { description: t.commands.dev, schema: config.schemas.dev },
  lint: { description: t.commands.lint, schema: config.schemas.lint },
  chat: { description: t.commands.chat, schema: config.schemas.chat },
  profiles: {
    description: t.commands.profiles.description,
    subcommands: {
      list: { description: t.commands.profiles.list, schema: config.schemas.listProfiles, alias: 'ls' },
      active: {
        description: t.commands.profiles.active,
        schema: config.schemas.activeProfile,
      },
      use: {
        description: t.commands.profiles.use,
        schema: config.schemas.useProfile,
      },
    },
  },
} satisfies DefinitionTree
