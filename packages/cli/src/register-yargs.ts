import yargs, { YargsArgv, YargsConfig, cleanupConfig, parseEnv } from '@bpinternal/yargs-extra'
import _ from 'lodash'
import * as tree from './command-tree'
import type * as typings from './typings'

export type YargsInstance = typeof yargs

const parseArguments = <S extends typings.CommandSchema>(schema: S, argv: YargsArgv<S>): YargsConfig<S> => {
  const yargsEnv = parseEnv(schema, 'BP')
  return cleanupConfig(schema, { ...argv, ...yargsEnv })
}

export const registerYargs = (yargz: YargsInstance, commands: tree.CommandTree) => {
  for (const cmdName in commands) {
    const command = commands[cmdName] as tree.CommandTreeNode

    if (tree.guards.command.isSubTree(command)) {
      yargz.command(cmdName, command.description ?? cmdName, (y) => {
        registerYargs(y, command.subcommands)
        return y
      })
      continue
    }

    const { schema, description, alias } = command
    const aliases = alias ? [cmdName, alias] : [cmdName]

    const options = Object.entries(schema)
    let positionals = options.filter(
      (value): value is [string, typings.CommandPositionalOption] => !!value[1].positional
    )

    let usage = aliases
    if (positionals.length) {
      positionals = _.sortBy(positionals, ([, option]) => option.idx)
      const positionalArgs = positionals.map(([optName, option]) =>
        option.demandOption ? `<${optName}>` : `[${optName}]`
      )
      const positionalStr = positionalArgs.join(' ')
      usage = aliases.map((optAlias) => `${optAlias} ${positionalStr}`)
    }

    yargz.command(
      usage,
      description ?? cmdName,
      (y) => {
        for (const [key, option] of Object.entries(schema)) {
          if (option.positional) {
            y = y.positional(key, option)
          } else {
            y = y.option(key, option)
          }
        }
        return y
      },
      async (argv) => {
        const parsed = parseArguments(schema, argv)
        const { exitCode } = await command.handler({ ...parsed })
        process.exit(exitCode)
      }
    )
  }
}
