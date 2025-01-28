import childprocess from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import pathlib from 'path'
import tmp from 'tmp'
import * as uuid from 'uuid'

type PackageJson = {
  name: string
  version?: string
  description?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class TmpDirectory {
  private _closed = false

  public static create() {
    return new TmpDirectory(tmp.dirSync({ unsafeCleanup: true }))
  }

  private constructor(private _res: tmp.DirResult) {}

  public get path() {
    if (this._closed) {
      throw new Error('Cannot access tmp directory after cleanup')
    }
    return this._res.name
  }

  public cleanup() {
    if (this._closed) {
      return
    }
    this._res.removeCallback()
  }
}

export type RunCommandOptions = {
  workDir: string
}

export type RunCommandOutput = {
  exitCode: number
}

export const runCommand = async (cmd: string, { workDir }: RunCommandOptions): Promise<RunCommandOutput> => {
  const [program, ...args] = cmd.split(' ')
  if (!program) {
    throw new Error('Cannot run empty command')
  }
  const { error, status } = childprocess.spawnSync(program, args, {
    cwd: workDir,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  if (error) {
    throw error
  }
  return { exitCode: status ?? 0 }
}

export const npmInstall = ({ workDir }: RunCommandOptions): Promise<RunCommandOutput> => {
  return runCommand('pnpm install', { workDir })
}

export const tscCheck = ({ workDir }: RunCommandOptions): Promise<RunCommandOutput> => {
  return runCommand('tsc --noEmit', { workDir })
}

export const fixBotpressDependencies = async ({
  workDir,
  target,
}: {
  workDir: string
  target: Record<string, string | undefined>
}) => {
  const packageJsonPath = pathlib.join(workDir, 'package.json')
  const originalPackageJson: PackageJson = require(packageJsonPath)

  const newPackageJson = {
    ...originalPackageJson,
    dependencies: _.mapValues(originalPackageJson.dependencies ?? {}, (version, name) => target[name] ?? version),
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2))
}

export const handleExitCode = ({ exitCode }: { exitCode: number }) => {
  if (exitCode !== 0) {
    throw new Error(`Command exited with code ${exitCode}`)
  }
}

export const getUUID = () => uuid.v4().replace(/-/g, '')
