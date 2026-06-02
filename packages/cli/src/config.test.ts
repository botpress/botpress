import { describe, expect, it } from 'vitest'
import yargs, { cleanupConfig } from '@bpinternal/yargs-extra'
import { schemas } from './config'

const watchSchema = { watch: schemas.dev.watch }

const parseWatch = (args: string[]) => {
  const argv = yargs(args).option('watch', schemas.dev.watch).parseSync()
  return cleanupConfig(watchSchema, argv)
}

describe('config schemas', () => {
  it('enables dev file watching by default', () => {
    expect(parseWatch([])).toEqual({ watch: true })
  })

  it('parses --no-watch as disabled dev file watching', () => {
    expect(parseWatch(['--no-watch'])).toEqual({ watch: false })
  })
})
