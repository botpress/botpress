import path from 'path'
import nsfw from 'nsfw'
import minimatch from 'minimatch'

import { buildBackend } from './build'
import { watch as webpackWatch } from './webpack'

export default async (argv: any) => {
  if (argv.verbose) {
    console.log('Verbose on!')
  }

  const modulePath = path.resolve(argv.path || process.cwd())

  let promise: null | Promise<void> = buildBackend(modulePath)

  const watcher = await nsfw(
    path.join(modulePath, 'src'),
    events => {
      const files = events.map(x => path.relative(modulePath, path.join(x.directory, x.file)))
      const matchDts = minimatch.match(files, '!**/*.d.ts', { nocase: true })
      const matchWeb = minimatch.match(files, '!src/views/**', { nocase: true })
      if (matchDts.length && matchWeb.length && !promise.isPending) {
        console.log('Backend files changed')
        promise = buildBackend(modulePath)
      }
    },
    { debounceMS: 500 }
  )

  watcher.start()

  webpackWatch(modulePath)
}
