import 'bluebird-global'
import chokidar from 'chokidar'
import path from 'path'

import { buildBackend } from './build'
import { debug } from './log'
import { watch as webpackWatch } from './webpack'

export default async (argv: any) => {
  const modulePath = path.resolve(argv.path || process.cwd())

  let promise: Promise<void> = buildBackend(modulePath)

  const rebuild = () => {
    if (!promise.isPending) {
      debug('Backend files changed')
      promise = buildBackend(modulePath)
    }
  }

  const watcher = chokidar.watch(path.join(modulePath, 'src'), {
    ignored: ['**/*.d.ts'],
    ignoreInitial: true,
    atomic: 500
  })

  watcher.on('add', rebuild)
  watcher.on('change', rebuild)
  watcher.on('unlink', rebuild)

  webpackWatch(modulePath)
}
