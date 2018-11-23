import { ChildProcess, execFile, execFileSync } from 'child_process'
import { EOL } from 'os'
import { join } from 'path'

let bin = 'ft_linux'
if (process.platform === 'win32') {
  bin = 'ft_win.exe'
} else if (process.platform === 'darwin') {
  bin = 'ft_osx'
}

let BINPATH = join(__dirname, bin)

export default class FTWrapper {
  binpath = BINPATH

  private static process_cache: { [key: string]: ChildProcess } = {}
  private static process_cache_lock: { [key: string]: boolean } = {}
  private static process_cache_expiry: { [key: string]: number } = {}

  static changeBinPath(newPath: string) {
    BINPATH = newPath
  }

  static supervised(
    trainingSetPath: string,
    modelOutPath: string,
    learningRate: number = 0.8,
    epoch: number = 1000,
    bucket: number = 25000,
    dim: number = 15,
    wordGram: number = 3,
    minCount: number = 1,
    minn: number = 3,
    maxn: number = 6
  ) {
    try {
      execFileSync(
        BINPATH,
        [
          'supervised',
          '-input',
          trainingSetPath,
          '-output',
          modelOutPath,
          '-lr',
          learningRate.toString(),
          '-epoch',
          epoch.toString(),
          '-loss',
          'hs',
          '-dim',
          dim.toString(),
          '-bucket',
          bucket.toString(),
          '-wordNgrams',
          wordGram.toString(),
          '-minCount',
          minCount.toString(),
          '-minn',
          minn.toString(),
          '-maxn',
          maxn.toString()
        ],
        { stdio: 'ignore' }
      )
    } catch (err) {
      throw new Error(`Error training the NLU model.
stdout: ${err.stdout && err.stdout.toString()}
stderr: ${err.stderr && err.stderr.toString()}
message: ${err.message}
status: ${err.status}
pid: ${err.pid}
signal: ${err.signal}
`)
    }
  }

  private static _scheduleProcessCleanup(modelPath: string, expiry: number) {
    setTimeout(async () => {
      if (FTWrapper.process_cache_expiry[modelPath] !== expiry) {
        return
      }

      while (FTWrapper.process_cache_lock[modelPath]) {
        await Promise.delay(100) // wait until the lock was release
        if (FTWrapper.process_cache_expiry[modelPath] !== expiry) {
          return
        }
      }

      if (FTWrapper.process_cache[modelPath]) {
        FTWrapper.process_cache[modelPath].kill()
      }

      delete FTWrapper.process_cache[modelPath]
      delete FTWrapper.process_cache_expiry[modelPath]
      delete FTWrapper.process_cache_lock[modelPath]
    }, 5000) // kill the process if not called after a while
  }

  /** @description Spins a fastText process for the model in the background
   * and keep it running until it's not used anymore. When used, the process i/o is locked so that
   * there's only one producer and consumer of the streams at any given time.
   */
  private static async _acquireProcess(modelPath: string): Promise<ChildProcess> {
    if (FTWrapper.process_cache_lock[modelPath] === true) {
      await Promise.delay(1) // re-queue async task
      return FTWrapper._acquireProcess(modelPath)
    } else {
      FTWrapper.process_cache_lock[modelPath] = true
    }

    try {
      if (!FTWrapper.process_cache[modelPath]) {
        const args = ['predict-prob', modelPath, '-', 5]

        FTWrapper.process_cache[modelPath] = execFile(BINPATH, args, {
          encoding: 'utf8',
          stdio: ['pipe', 'ignore', 'ignore']
        })

        FTWrapper.process_cache[modelPath].stdout.on('close', () => {
          delete FTWrapper.process_cache[modelPath]
          delete FTWrapper.process_cache_expiry[modelPath]
          delete FTWrapper.process_cache_lock[modelPath]
        })
      }

      // Schedule expiry of the process
      const expiry = Date.now() + 5000
      FTWrapper.process_cache_expiry[modelPath] = expiry // in X seconds
      FTWrapper._scheduleProcessCleanup(modelPath, expiry)

      return FTWrapper.process_cache[modelPath]
    } catch {
      FTWrapper._releaseProcess(modelPath)
    }
  }

  private static _releaseProcess(modelPath: string) {
    delete FTWrapper.process_cache_lock[modelPath]
  }

  public static async predictProb(modelPath: string, inputText: string): Promise<string> {
    try {
      const process = await FTWrapper._acquireProcess(modelPath)
      return new Promise<string>(resolve => {
        process.stdin.write(`${inputText}${EOL}`)
        process.stdout.once('data', resolve)
      })
    } finally {
      FTWrapper._releaseProcess(modelPath)
    }
  }
}
