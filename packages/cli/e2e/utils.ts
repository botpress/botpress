import childprocess from 'child_process'
import tmp from 'tmp'

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

export const handleExitCode = ({ exitCode }: { exitCode: number }) => {
  if (exitCode !== 0) {
    throw new Error(`Command exited with code ${exitCode}`)
  }
}
