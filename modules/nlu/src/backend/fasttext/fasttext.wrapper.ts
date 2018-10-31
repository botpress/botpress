import { execFile, execFileSync } from 'child_process'
import { join } from 'path'
import { Readable } from 'stream'

let bin = 'ft_linux'
if (process.platform === 'win32') {
  bin = 'ft_win.exe'
} else if (process.platform === 'darwin') {
  bin = 'ft_osx'
}

let BINPATH = join(__dirname, bin)

export default class FTWrapper {
  binpath = BINPATH

  static changeBinPath(newPath: string) {
    BINPATH = newPath
  }

  static supervised(
    trainingSetPath: string,
    modelOutPath: string,
    learningRate: number = 1,
    epoch: number = 500,
    bucket: number = 25000,
    dim: number = 10,
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

  static async predictProb(modelPath: string, inputText: string, numClass = 5): Promise<string> {
    const args = ['predict-prob', modelPath, '-', numClass.toString()]
    const result = execFile(BINPATH, args, {
      encoding: 'utf8',
      stdio: ['pipe', 'ignore', 'ignore']
    })

    let out: string = ''
    result.stdin.end(inputText)
    result.stdout.on('data', chunk => {
      out += chunk
    })

    return Promise.fromCallback<string>(cb => {
      result.stdout.on('close', () => {
        cb(undefined, out)
      })
    })
  }
}
