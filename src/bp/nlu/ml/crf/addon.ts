const addon = require('./crfsuite.node')
export default addon as BindingType

type TaggerCtor = new () => Tagger
type TrainerCtor = new (opt?: TrainerOptions) => Trainer

interface BindingType {
  Tagger: TaggerCtor
  Trainer: TrainerCtor
}

export interface Tagger {
  tag(xseq: Array<string[]>): { probability: number; result: string[] }
  open(model_filename: string): boolean
  marginal(xseq: Array<string[]>): { [key: string]: number }[]
}

export interface Options {
  [key: string]: string
}

export interface TrainerOptions {
  [key: string]: any
  debug?: boolean
}

export interface Trainer {
  append(xseq: Array<string[]>, yseq: string[]): void
  train(model_filename: string, progress?: (iteration: number) => number | undefined): number
  train_async(model_filename: string, progress?: (iteration: number) => number | undefined): Promise<number>
  get_params(options: Options): any
  set_params(options: Options): void
}
