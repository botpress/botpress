import commands from './command-implementations'
import type { GlobalCommandDefinition } from './command-implementations/global-command'
import * as consts from './consts'
import type { CommandArgv, CommandDefinition } from './typings'

type CommandGlobalOptions = {
  confirm?: boolean
  verbose?: boolean
  json?: boolean
  botpressHome?: string
}

type CommandArgvParams<C extends CommandDefinition = CommandDefinition> = Omit<
  CommandArgv<C>,
  'verbose' | 'confirm' | 'botpressHome' | 'json'
>

const wrapCommandHandler =
  <C extends GlobalCommandDefinition>(command: (argv: CommandArgv<C>) => Promise<{ exitCode: number }>) =>
  async (argv: CommandArgvParams<C>, opts: CommandGlobalOptions = {}) => {
    const args = {
      ...argv,
      confirm: opts.confirm ?? false,
      verbose: opts.verbose ?? false,
      json: opts.json ?? false,
      botpressHome: opts.botpressHome ?? consts.defaultBotpressHome,
    } as CommandArgv<C>
    return command(args)
  }

// type StripSubcommands<T> = T extends (...args: any) => any
//   ? T
//   : T extends object
//     ? 'subcommands' extends keyof T
//       ? Exclude<keyof T, 'subcommands'> extends never
//         ? StripSubcommands<T['subcommands']>
//         : { [K in keyof T]: StripSubcommands<T[K]> } // fallback: regular object
//       : { [K in keyof T]: StripSubcommands<T[K]> }
//     : T
//
// // 2) Runtime helper that implements the same logic
// function stripSubcommands<T>(obj: T): StripSubcommands<T> {
//   if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
//     const keys = Object.keys(obj as object)
//     // If the object is exactly { subcommands: ... }, collapse it
//     if (keys.length === 1 && keys[0] === 'subcommands') {
//       return stripSubcommands((obj as any).subcommands)
//     }
//     // Otherwise, map over properties
//     const out: any = {}
//     for (const k of keys) {
//       out[k] = stripSubcommands((obj as any)[k])
//     }
//     return out
//   }
//   return obj as any
// }
//
// const newCommands = stripSubcommands(commandImplementation)

export const login = wrapCommandHandler(commands.login)
export const logout = wrapCommandHandler(commands.logout)
export const bots = {
  create: wrapCommandHandler(commands.bots.subcommands.create),
  get: wrapCommandHandler(commands.bots.subcommands.get),
  delete: wrapCommandHandler(commands.bots.subcommands.delete),
  list: wrapCommandHandler(commands.bots.subcommands.list),
}
export const integrations = {
  get: wrapCommandHandler(commands.integrations.subcommands.get),
  list: wrapCommandHandler(commands.integrations.subcommands.list),
  delete: wrapCommandHandler(commands.integrations.subcommands.delete),
}
export const interfaces = {
  get: wrapCommandHandler(commands.interfaces.subcommands.get),
  list: wrapCommandHandler(commands.interfaces.subcommands.list),
  delete: wrapCommandHandler(commands.interfaces.subcommands.delete),
}
export const plugins = {
  get: wrapCommandHandler(commands.plugins.subcommands.get),
  list: wrapCommandHandler(commands.plugins.subcommands.list),
  delete: wrapCommandHandler(commands.plugins.subcommands.delete),
}
export const init = wrapCommandHandler(commands.init)
export const generate = wrapCommandHandler(commands.generate)
export const bundle = wrapCommandHandler(commands.bundle)
export const build = wrapCommandHandler(commands.build)
export const read = wrapCommandHandler(commands.read)
export const serve = wrapCommandHandler(commands.serve)
export const deploy = wrapCommandHandler(commands.deploy)
export const add = wrapCommandHandler(commands.add)
export const dev = wrapCommandHandler(commands.dev)
export const lint = wrapCommandHandler(commands.lint)
export const chat = wrapCommandHandler(commands.chat)
export const profiles = {
  list: wrapCommandHandler(commands.profiles.subcommands.list),
  active: wrapCommandHandler(commands.profiles.subcommands.active),
  use: wrapCommandHandler(commands.profiles.subcommands.use),
}
