import * as babel from '@babel/core'
import chalk from 'chalk'
import fs from 'fs'
import fse from 'fs-extra'
import glob from 'glob'
import mkdirp from 'mkdirp'
import os from 'os'
import path from 'path'
import rimraf from 'rimraf'
import * as ts from 'typescript'
import { generateSchema, getProgramFromFiles } from 'typescript-json-schema'

import { debug, error, normal } from './log'
import { build as webpackBuild } from './webpack'

export default async (argv: any) => {
  const modulePath = path.resolve(argv.path || process.cwd())

  await buildBackend(modulePath)
  await webpackBuild(modulePath)
  await buildConfigSchema(modulePath)

  normal('Build completed')
}

export async function buildBackend(modulePath: string): Promise<void> {
  const start = Date.now()

  let babelConfig: babel.TransformOptions = {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current'
          }
        }
      ],
      '@babel/preset-typescript',
      '@babel/preset-react'
    ],

    sourceMaps: true,
    sourceRoot: path.join(modulePath, 'src/backend'),
    parserOpts: {
      allowReturnOutsideFunction: true
    },
    plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-function-bind'],
    sourceType: 'module',
    cwd: path.resolve(__dirname, '..')
  }

  const babelFile = path.join(modulePath, 'babel.backend.js')

  if (fs.existsSync(babelFile)) {
    debug('Babel override found for backend')
    babelConfig = require(babelFile)(babelConfig)
  }

  const tsConfigFile = ts.findConfigFile(modulePath, ts.sys.fileExists, 'tsconfig.json')
  const skipCheck = process.argv.find(x => x.toLowerCase() === '--skip-check')

  // By default you don't want it to fail when watching, hence the flag
  const failOnError = process.argv.find(x => x.toLowerCase() === '--fail-on-error')

  let validCode = true
  if (!skipCheck && tsConfigFile) {
    validCode = runTypeChecker(modulePath)
  }

  if (validCode) {
    rimraf.sync(path.join(modulePath, 'dist'))

    copyExtraFiles(modulePath)
    compileBackend(modulePath, babelConfig)

    normal(`Generated backend (${Date.now() - start} ms)`, path.basename(modulePath))
  } else if (failOnError) {
    process.exit(1)
  }
}

// Allows to copy additional files to the dist directory of the module
const copyExtraFiles = (modulePath: string) => {
  const extrasFile = path.join(modulePath, 'build.extras.js')
  if (!fs.existsSync(extrasFile)) {
    return
  }

  const extras = require(extrasFile)
  if (extras && extras.copyFiles) {
    for (const instruction of extras.copyFiles) {
      const toCopy = glob.sync(instruction, {
        cwd: modulePath,
        dot: true
      })

      for (const file of toCopy) {
        const fromFull = path.join(modulePath, file)
        const dest = file.replace(/^src\//i, 'dist/').replace(/\.ts$/i, '.js')
        const destFull = path.join(modulePath, dest)
        mkdirp.sync(path.dirname(destFull))
        fse.copySync(fromFull, destFull)
        debug(`Copied "${file}" -> "${dest}"`)
      }
    }
  }
}

const compileBackend = (modulePath: string, babelConfig) => {
  const files = glob.sync('src/**/*.+(ts|js|jsx|tsx|json)', {
    cwd: modulePath,
    dot: true,
    ignore: ['**/*.d.ts', '**/views/**/*.*', '**/config.ts']
  })

  const copyWithoutTransform = ['actions', 'hooks', 'examples', 'content-types', 'bot-templates']
  const outputFiles: string[] = []

  for (const file of files) {
    const dest = file.replace(/^src\//i, 'dist/').replace(/\.ts$/i, '.js')
    mkdirp.sync(path.dirname(dest))

    if (copyWithoutTransform.find(x => file.startsWith(`src/${x}`)) || file.endsWith('.json')) {
      fs.writeFileSync(dest, fs.readFileSync(`${modulePath}/${file}`, 'utf8'))
      continue
    }

    try {
      const dBefore = Date.now()
      const result = babel.transformFileSync(file, babelConfig)
      const destMap = `${dest}.map`

      if (!result?.map) {
        return
      }

      fs.writeFileSync(dest, `${result.code}${os.EOL}//# sourceMappingURL=${path.basename(destMap)}`)
      result.map.sources = [path.relative(babelConfig.sourceRoot, file)]
      fs.writeFileSync(destMap, JSON.stringify(result.map))

      const totalTime = Date.now() - dBefore

      debug(`Generated "${dest}" (${totalTime} ms)`)

      outputFiles.push(dest)
    } catch (err) {
      error(`Error transpiling file "${file}"`) // TODO Better error
      throw err
    }
  }
}

const buildConfigSchema = async (modulePath: string) => {
  const config = path.resolve(modulePath, 'src', 'config.ts')
  if (!fs.existsSync(config)) {
    return
  }

  const settings = {
    required: true,
    ignoreErrors: true,
    noExtraProps: true,
    validationKeywords: ['see', 'example', 'pattern']
  }

  const program = getProgramFromFiles([config])
  const definition = generateSchema(program, 'Config', settings)

  if (definition && definition.properties) {
    definition.properties.$schema = { type: 'string' }
  }

  const schema = JSON.stringify(definition, undefined, 2) + os.EOL + os.EOL

  mkdirp.sync(path.resolve(modulePath, 'assets'))
  fs.writeFileSync(path.resolve(modulePath, 'assets', 'config.schema.json'), schema)
}

const getTsConfig = (rootFolder: string): ts.ParsedCommandLine => {
  const parseConfigHost: ts.ParseConfigHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    useCaseSensitiveFileNames: true
  }

  const configFileName = ts.findConfigFile(rootFolder, ts.sys.fileExists, 'tsconfig.json')
  const { config } = ts.readConfigFile(configFileName!, ts.sys.readFile)

  // These 3 objects are identical for all modules, but can't be in tsconfig.shared because the root folder is not processed correctly
  const fixedModuleConfig = {
    ...config,
    compilerOptions: {
      ...config.compilerOptions,
      typeRoots: ['./node_modules/@types', './node_modules', './src/typings']
    },
    exclude: ['**/*.test.ts', './src/views/**', '**/node_modules/**'],
    include: ['../../packages/bp/src/typings/*.d.ts', '**/*.ts']
  }

  return ts.parseJsonConfigFileContent(fixedModuleConfig, parseConfigHost, rootFolder)
}

const runTypeChecker = (rootFolder: string): boolean => {
  const { options, fileNames } = getTsConfig(rootFolder)

  const program = ts.createProgram(fileNames, options)
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(program.emit().diagnostics)

  for (const { file, start, messageText, code } of diagnostics) {
    if (file) {
      const { line, character } = file.getLineAndCharacterOfPosition(start!)
      const message = ts.flattenDiagnosticMessageText(messageText, '\n')

      error(
        chalk.bold(
          `[ERROR] in ${chalk.cyan(file.fileName)} (${line + 1},${character + 1})
                 TS${code}: ${message}
                 `
        )
      )
    } else {
      error(ts.flattenDiagnosticMessageText(messageText, '\n'))
    }
  }

  return !diagnostics.length
}
