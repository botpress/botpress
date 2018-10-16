import { execFileSync } from 'child_process'
import { join } from 'path'

let bin = 'fasttext'
if (process.platform === 'win32') {
  bin = 'fasttext_win'
}

const BINPATH = join(__dirname, bin)

export default class FTWrapper {
  binpath = BINPATH
  static supervised(trainingSetPath: string, modelOutPath: string, learningRate: number = 0.7, epoch: number = 1) {
    execFileSync(BINPATH, [
      'supervised',
      '-input',
      trainingSetPath,
      '-output',
      modelOutPath,
      '-lr',
      learningRate.toString(),
      '-epoch',
      epoch.toString()
    ])
  }

  static predictProb(modelPath: string, inputFilePath: string, numClass = 1): string {
    return execFileSync(BINPATH, ['predict-prob', modelPath, inputFilePath, numClass.toString()]).toString()
  }
}
