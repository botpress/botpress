#!/usr/bin/env TS_NODE_COMPILER_OPTIONS={"downlevelIteration":true} ts-node

import * as cp from 'child_process'
import * as fse from 'fs-extra'
import * as glob from 'glob'
import * as path from 'path'

const files = glob.sync('**/package.json', { ignore: '**/node_modules/**' })

function* amendFiles(yarnInstall: boolean) {
  for (const file of files) {
    const content = fse.readJsonSync(file)
    if (content && content.author && content.author.toLowerCase().includes('botpress')) {
      yield [content, file]
      fse.writeJsonSync(file, content, { spaces: 2 })
      if (yarnInstall) {
        console.log('==> yarn install for ' + file)
        try {
          cp.execSync('yarn install --force', { env: process.env, cwd: path.dirname(file) })
        } catch (err) {
          console.error('==> ERROR running yarn install for ' + file)
        }
      }
    }
  }
}

for (const [content, file] of amendFiles(true)) {
  // YOUR OPERATION HERE, MUTATE CONTENT
  console.log(`*** Processing ${file} ***`)
  content.resolutions = Object.assign({}, content.resolutions, {
    fstream: '>=1.0.12'
  })
  // END OF YOUR OPERATION
}
