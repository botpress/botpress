import { ChildProcess, execFile, ExecFileOptions, execFileSync } from 'child_process'
import fs from 'fs'
import { EOL } from 'os'
import { join } from 'path'

let bin = 'ft_linux'
if (process.platform === 'win32') {
  bin = 'ft_win.exe'
} else if (process.platform === 'darwin') {
  bin = 'ft_osx'
}

export type FastTextTrainArgs = {
  method: 'supervised' | 'skipgram' | 'cbow'
  learningRate: number
  epoch: number
  bucket: number
  dim: number
  wordGram: number
  minCount: number
  minn: number
  maxn: number
}

export const DefaultFastTextTrainArgs: FastTextTrainArgs = {
  method: 'supervised',
  learningRate: 0.8,
  epoch: 1000,
  bucket: 25000,
  dim: 15,
  wordGram: 3,
  minCount: 1,
  minn: 3,
  maxn: 6
}

export type FastTextQueryArgs = {
  method: 'nn' | 'predict-prob' | 'print-word-vectors'
  k: number
}

export const DefaultFastTextQueryArgs: FastTextQueryArgs = {
  method: 'predict-prob',
  k: 5
}

export default class FastTextWrapper {
  public static LABEL_PREFIX = '__label__'

  private static BINPATH = join(__dirname, bin)
  private static process_cache: { [key: string]: ChildProcess } = {}
  private static process_cache_lock: { [key: string]: boolean } = {}
  private static process_cache_expiry: { [key: string]: number } = {}

  static configure(newPath: string) {
    if (fs.existsSync(newPath)) {
      this.BINPATH = newPath
    } else {
      throw new Error(`FastText not found at path "${newPath}"`)
    }
  }

  static async train(
    trainingPath: string,
    modelPath: string,
    args: Partial<FastTextTrainArgs> = DefaultFastTextTrainArgs
  ): Promise<void> {
    const fArgs = { ...DefaultFastTextTrainArgs, ...(args || {}) } as FastTextTrainArgs

    try {
      execFileSync(
        this.BINPATH,
        [
          fArgs.method,
          '-input',
          trainingPath,
          '-output',
          modelPath,
          '-lr',
          fArgs.learningRate,
          '-epoch',
          fArgs.epoch,
          '-loss',
          'hs',
          '-dim',
          fArgs.dim,
          '-bucket',
          fArgs.bucket,
          '-wordNgrams',
          fArgs.wordGram,
          '-minCount',
          fArgs.minCount,
          '-minn',
          fArgs.minn,
          '-maxn',
          fArgs.maxn
        ].map(x => x.toString()),
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

  public static async predict(
    modelPath: string,
    sentence: string,
    k: number = DefaultFastTextQueryArgs.k
  ): Promise<{ name: string; confidence: number }[]> {
    const result = await this.query(modelPath, sentence, { method: 'predict-prob', k })

    const parts = result.split(/\s|\n|\r/gi).filter(x => x.trim().length)
    const parsed: { name: string; confidence: number }[] = []

    if (parts.length <= 1) {
      return []
    }

    for (let i = 0; i < parts.length - 1; i += 2) {
      parsed.push({
        name: parts[0].replace(this.LABEL_PREFIX, '').trim(),
        confidence: parseFloat(parts[1])
      })
    }

    return parsed
  }

  public static async wordVectors(modelPath: string, word: string): Promise<number[]> {
    const result = await this.query(modelPath, word, { method: 'print-word-vectors' })

    return result
      .split(/\s|\n|\r/gi)
      .filter(x => x.trim().length)
      .map(x => parseFloat(x))
      .filter(x => !isNaN(x))
  }

  private static async query(
    modelPath: string,
    input: string,
    args: Partial<FastTextQueryArgs> = DefaultFastTextQueryArgs
  ): Promise<string> {
    const fArgs = { ...DefaultFastTextQueryArgs, ...(args || {}) } as FastTextQueryArgs
    const binArgs = [fArgs.method, modelPath]

    if (fArgs.method === 'predict-prob') {
      binArgs.push('-')
      binArgs.push(fArgs.k.toString())
    } else if (fArgs.method === 'nn') {
      binArgs.push(fArgs.k.toString())
    }

    try {
      const process = await this._acquireProcess(modelPath, binArgs)
      return new Promise<string>(resolve => {
        process.stdin.write(`${input}${EOL}`)
        process.stdout.once('data', resolve)
      })
    } finally {
      this._releaseProcess(modelPath)
    }
  }

  private static _scheduleProcessCleanup(modelPath: string, expiry: number) {
    setTimeout(async () => {
      if (this.process_cache_expiry[modelPath] !== expiry) {
        return
      }

      while (this.process_cache_lock[modelPath]) {
        await Promise.delay(100) // wait until the lock was release
        if (this.process_cache_expiry[modelPath] !== expiry) {
          return
        }
      }

      if (this.process_cache[modelPath]) {
        this.process_cache[modelPath].kill()
      }

      delete this.process_cache[modelPath]
      delete this.process_cache_expiry[modelPath]
      delete this.process_cache_lock[modelPath]
    }, 5000) // kill the process if not called after a while
  }

  /** @description Spins a fastText process for the model in the background
   * and keep it running until it's not used anymore. When used, the process i/o is locked so that
   * there's only one producer and consumer of the streams at any given time.
   */
  private static async _acquireProcess(modelPath: string, args: string[]): Promise<ChildProcess> {
    if (this.process_cache_lock[modelPath] === true) {
      await Promise.delay(1) // re-queue async task
      return this._acquireProcess(modelPath, args)
    } else {
      this.process_cache_lock[modelPath] = true
    }

    try {
      if (!this.process_cache[modelPath]) {
        this.process_cache[modelPath] = execFile(this.BINPATH, args, {
          encoding: 'utf8',
          stdio: ['pipe', 'ignore', 'ignore']
        } as ExecFileOptions)

        this.process_cache[modelPath].stdout.on('close', () => {
          delete this.process_cache[modelPath]
          delete this.process_cache_expiry[modelPath]
          delete this.process_cache_lock[modelPath]
        })
      }

      // Schedule expiry of the process
      const expiry = Date.now() + 5000
      this.process_cache_expiry[modelPath] = expiry // in X seconds
      this._scheduleProcessCleanup(modelPath, expiry)

      return this.process_cache[modelPath]
    } catch {
      this._releaseProcess(modelPath)
    }
  }

  private static _releaseProcess(modelPath: string) {
    delete this.process_cache_lock[modelPath]
  }
}
