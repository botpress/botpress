import childprocess from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import pathlib from 'path'
import tmp from 'tmp'

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

export const npmInstall = async ({ workDir }: { workDir: string }) => {
  const { status } = childprocess.spawnSync('pnpm', ['install'], {
    cwd: workDir,
    stdio: 'inherit',
  })
  return { exitCode: status ?? 0 }
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
