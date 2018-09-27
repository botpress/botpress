import glob from 'glob'
import * as babel from '@babel/core'
import mkdirp from 'mkdirp'
import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import { debug, error, normal } from './log'

import { build as webpackBuild } from './webpack'

export default async (argv: any) => {
  const modulePath = path.resolve(argv.path || process.cwd())

  await buildBackend(modulePath)
  await webpackBuild(modulePath)

  normal('Build completed')
}

export async function buildBackend(modulePath: string) {
  let babelConfig: babel.TransformOptions = {
    presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'],
    plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-function-bind'],
    sourceType: 'module',
    cwd: modulePath
  }

  const babelFile = path.join(modulePath, 'babel.backend.js')

  if (fs.existsSync(babelFile)) {
    debug('Babel override found for backend')
    babelConfig = require(babelFile)(babelConfig)
  }

  const files = glob.sync('src/**/*.+(ts|js|jsx|tsx)', {
    cwd: modulePath,
    ignore: ['**/*.d.ts', '**/views/**/*.*']
  })

  rimraf.sync(path.join(modulePath, 'dist'))

  const outputFiles = []

  for (let file of files) {
    try {
      const dBefore = Date.now()
      const result = babel.transformFileSync(file, babelConfig)

      const dest = file.replace(/^src\//i, 'dist/')
      mkdirp.sync(path.dirname(dest))
      fs.writeFileSync(dest, result.code)
      const totalTime = Date.now() - dBefore

      debug(`Generated "${dest}" (${totalTime} ms)`)

      outputFiles.push(dest)
    } catch (err) {
      error(`Error transpiling file "${file}"`) // TODO Better error
      throw err
    }
  }
}
