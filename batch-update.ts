#!/usr/bin/env TS_NODE_COMPILER_OPTIONS={"downlevelIteration":true} ts-node

import chalk from 'chalk'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as glob from 'glob'
import * as path from 'path'

const IS_DRY_RUN = !process.argv.includes('--apply')
const files = glob.sync('**/package.json', { ignore: ['**/node_modules/**', 'examples/**'] })

function* amendFiles(yarnInstall: boolean) {
  let count = 0
  for (const file of files) {
    const content = fse.readJsonSync(file)
    if (content && content.author && content.author.toLowerCase().includes('botpress')) {
      let save = false
      const saveFn = () => (save = true)
      yield [content, file, saveFn]
      if (!save) {
        console.info(chalk.grey(`Skipping ${file} (no changes)`))
        continue
      }

      count++

      if (IS_DRY_RUN) {
        console.info(chalk.bold(`==> File ${chalk.bold(file)} has changes (DRY RUN)`))
      } else {
        console.info(chalk.bold(`==> Applying changes to ${chalk.bold(file)}`))
        fse.writeJsonSync(file, content, { spaces: 2 })
      }

      if (!IS_DRY_RUN && yarnInstall) {
        console.info(chalk.grey('==> yarn install --force'))
        try {
          cp.execSync('yarn install --force', {
            env: process.env,
            cwd: path.dirname(file),
            stdio: [
              0, // Use parent's stdin for child.
              'ignore', // Pipe child's stdout to parent.
              fs.openSync('err.out', 'w') // Direct child's stderr to a file.
            ]
          })
          console.info(chalk.green('    success'))
        } catch (err) {
          console.error(chalk.red('==> ERROR running yarn install (see err.out)'))
        }
      }
    }
  }

  console.info(chalk.bold(`Done processing ${files.length} file${files.length === 1 ? '' : 's'}`))

  if (count > 0) {
    console.info(chalk.green(`Changed ${chalk.bold(count.toString())} file${count === 1 ? '' : 's'} successfully`))
    if (IS_DRY_RUN) {
      console.info(chalk.red.bold('THIS WAS A DRY RUN, SO NO FILE WAS ACTUALLY CHANGED'))
      console.info(chalk.red(`Run this again with ${chalk.bold('--apply')} to execute the changes`))
    }
  } else {
    console.info(chalk.green('There are no changes'))
  }
}

/**
 * Content : package.json content
 * file: file name
 * save: function to be called if you want to apply changes
 *
 * Amend the content to of the package.json as you please and call save if necessary
 */
for (const [content, file, save] of amendFiles(true)) {
  // fstream vulnerability CVE-2019-13173
  content.resolutions = Object.assign({}, content.resolutions, {
    fstream: '>=1.0.12',
    lodash: '>=4.17.21'
  })
  save()
}
