import { execFile, execFileSync } from 'child_process'
import { join } from 'path'

let bin = 'ft_lnx'
if (process.platform === 'win32') {
  bin = 'ft_win'
} else if (process.platform === 'darwin') {
  bin = 'ft_osx'
}

const BINPATH = join(__dirname, bin)

export default class FTWrapper {
  binpath = BINPATH
  static supervised(
    trainingSetPath: string,
    modelOutPath: string,
    learningRate: number = 1,
    epoch: number = 500,
    bucket: number = 10000,
    dim: number = 10
  ) {
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
        bucket.toString()
      ],
      { stdio: 'ignore' }
    )
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
