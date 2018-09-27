import path from 'path'
import chokidar from 'chokidar'

import { debug } from './log'
import { buildBackend } from './build'
import { watch as webpackWatch } from './webpack'

export default async (argv: any) => {
  const modulePath = path.resolve(argv.path || process.cwd())

  let promise: null | Promise<void> = buildBackend(modulePath)

  const rebuild = () => {
    if (!promise.isPending) {
      debug('Backend files changed')
      promise = buildBackend(modulePath)
    }
  }

  const watcher = chokidar.watch(path.join(modulePath, 'src'), {
    ignored: ['**/*.d.ts', '**/src/views/**'],
    ignoreInitial: true,
    atomic: 500
  })

  watcher.on('add', rebuild)
  watcher.on('change', rebuild)
  watcher.on('unlink', rebuild)

  webpackWatch(modulePath)
}
